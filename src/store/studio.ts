"use client";
import { create } from "zustand";
import type { Settings, Pattern, Song } from "../types/music";
import { PATTERNS } from "../audio/rhythm/patterns";
import { adaptPattern, validatePattern } from "../audio/rhythm/PatternEngine";
import { DEFAULT_SONG } from "../musicTheory/progressions";
import { NOTES } from "../musicTheory/notes";
export const DEFAULT_SETTINGS: Settings = {
  instrument: "guitar",
  key: "C",
  scale: "major",
  octave: 4,
  bpm: 80,
  signature: "4/4",
  quantization: "immediate",
  guitarTouch: "DOWN",
  pianoTouch: "BLOCK",
  playMode: "trigger",
  patternId: "g-acoustic",
  humanize: 15,
  velocity: 0.8,
  volume: 0.75,
  instrumentVolume: 0.85,
  metronomeVolume: 0.45,
  metronome: false,
  muted: false,
  sustain: 0.5,
  duration: 1,
  strumMs: 16,
  inversion: 0,
  voiceLeading: false,
};
interface StudioStore {
  settings: Settings;
  pattern: Pattern;
  customs: Pattern[];
  song: Song;
  mode: "free" | "song";
  audioStatus: "disabled" | "loading" | "ready" | "error";
  message: string;
  onboarded: boolean;
  hydrated: boolean;
  set: (patch: Partial<Settings>) => void;
  selectPattern: (id: string) => void;
  editPattern: (pattern: Pattern) => void;
  savePattern: (name: string) => void;
  deletePattern: (id: string) => void;
  setSong: (song: Song) => void;
  hydrate: () => void;
  persist: () => void;
}
export const useStudio = create<StudioStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  pattern: PATTERNS.find((p) => p.id === "g-acoustic")!,
  customs: [],
  song: DEFAULT_SONG,
  mode: "free",
  audioStatus: "disabled",
  message: "",
  onboarded: false,
  hydrated: false,
  set: (patch) => {
    const state = get();
    let pattern = state.pattern;
    const settings = { ...state.settings, ...patch };
    if (patch.instrument && patch.instrument !== state.settings.instrument) {
      pattern = PATTERNS.find(
        (p) =>
          p.id === (patch.instrument === "guitar" ? "g-acoustic" : "p-broken"),
      )!;
      settings.patternId = pattern.id;
    }
    if (settings.signature !== pattern.signature)
      pattern = adaptPattern(pattern, settings.signature);
    set({ settings, pattern });
    get().persist();
  },
  selectPattern: (id) => {
    const p = [...PATTERNS, ...get().customs].find((p) => p.id === id);
    if (!p) return;
    set({
      pattern: structuredClone(p),
      settings: {
        ...get().settings,
        patternId: id,
        signature: p.signature,
        instrument: p.instrument,
      },
    });
    get().persist();
  },
  editPattern: (pattern) => {
    set({ pattern });
  },
  savePattern: (name) => {
    const state = get();
    const error = validatePattern(state.pattern);
    if (error) {
      set({ message: error });
      return;
    }
    const pattern = {
      ...structuredClone(state.pattern),
      id: `custom-${Date.now()}`,
      name: name.trim() || "Mẫu chưa đặt tên",
      custom: true,
    };
    set({
      pattern,
      customs: [...state.customs, pattern],
      settings: { ...state.settings, patternId: pattern.id },
      message: "Đã lưu mẫu trên thiết bị.",
    });
    get().persist();
  },
  deletePattern: (id) => {
    set({ customs: get().customs.filter((p) => p.id !== id) });
    if (get().pattern.id === id)
      get().selectPattern(
        get().settings.instrument === "guitar" ? "g-acoustic" : "p-broken",
      );
    get().persist();
  },
  setSong: (song) => {
    set({ song });
    get().persist();
  },
  persist: () => {
    const s = get();
    try {
      localStorage.setItem(
        "chordroom-v1",
        JSON.stringify({
          settings: s.settings,
          customs: s.customs,
          song: s.song,
          onboarded: s.onboarded,
        }),
      );
    } catch {
      set({
        message:
          "Bộ nhớ thiết bị không khả dụng hoặc đã đầy. Bạn vẫn chơi được nhưng thay đổi sẽ không được lưu.",
      });
    }
  },
  hydrate: () => {
    try {
      const raw = localStorage.getItem("chordroom-v1");
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const parsed = JSON.parse(raw);
      const settings = { ...DEFAULT_SETTINGS };
      if (parsed.settings && typeof parsed.settings === "object") {
        const p = parsed.settings;
        const enums = {
          instrument: ["guitar", "piano"],
          key: NOTES,
          scale: ["major", "minor"],
          signature: ["4/4", "3/4", "6/8"],
          guitarTouch: [
            "DOWN",
            "UP",
            "PALM_MUTE",
            "BASS",
            "PICK_1",
            "PICK_2",
            "PICK_3",
            "PICK_4",
            "PICK_5",
            "PICK_6",
            "MUTE",
            "SLAP",
          ],
          pianoTouch: ["BLOCK", "OCTAVE", "ROOT", "THIRD", "FIFTH", "TOP"],
        };
        for (const [key, values] of Object.entries(enums))
          if ((values as string[]).includes(p[key]))
            Object.assign(settings, { [key]: p[key] });
        const ranges = {
          octave: [2, 5],
          bpm: [40, 240],
          humanize: [0, 100],
          velocity: [0, 1],
          volume: [0, 1],
          instrumentVolume: [0, 1],
          metronomeVolume: [0, 1],
          sustain: [0, 1],
          duration: [0.1, 3],
          strumMs: [10, 25],
          inversion: [0, 2],
        };
        for (const [key, [min, max]] of Object.entries(ranges))
          if (typeof p[key] === "number" && Number.isFinite(p[key]))
            Object.assign(settings, {
              [key]: Math.min(
                max,
                Math.max(
                  min,
                  ["octave", "bpm", "inversion"].includes(key)
                    ? Math.round(p[key])
                    : p[key],
                ),
              ),
            });
        for (const key of ["voiceLeading"])
          if (typeof p[key] === "boolean")
            Object.assign(settings, { [key]: p[key] });
      }
      const customs: Pattern[] = Array.isArray(parsed.customs)
        ? parsed.customs
            .filter((p: Pattern) => {
              try {
                return (
                  typeof p.id === "string" &&
                  typeof p.name === "string" &&
                  !validatePattern(p)
                );
              } catch {
                return false;
              }
            })
            .slice(0, 100)
        : [];
      const candidate =
        [...PATTERNS, ...customs].find(
          (p) =>
            p.id === parsed.settings?.patternId &&
            p.instrument === settings.instrument,
        ) ?? PATTERNS.find((p) => p.instrument === settings.instrument)!;
      settings.patternId = candidate.id;
      const song: Song = validSong(parsed.song)
        ? parsed.song
        : structuredClone(DEFAULT_SONG);
      if (song.title === "A little room to play")
        song.title = DEFAULT_SONG.title;
      song.sections = song.sections.map((section) => ({
        ...section,
        name:
          (
            {
              Verse: "Đoạn chính",
              Chorus: "Điệp khúc",
              Bridge: "Đoạn chuyển",
            } as Record<string, string>
          )[section.name] ?? section.name,
      }));
      set({
        settings,
        customs,
        song,
        pattern: adaptPattern(candidate, settings.signature),
        onboarded: parsed.onboarded === true,
        hydrated: true,
      });
    } catch {
      set({
        hydrated: true,
        message:
          "Không đọc được dữ liệu đã lưu. Đã khôi phục thiết lập mặc định.",
      });
    }
  },
}));
function validSong(value: unknown): value is Song {
  if (!value || typeof value !== "object") return false;
  const s = value as Song;
  return (
    typeof s.title === "string" &&
    NOTES.includes(s.key) &&
    ["major", "minor"].includes(s.scale) &&
    Number.isFinite(s.bpm) &&
    s.bpm >= 40 &&
    s.bpm <= 240 &&
    ["4/4", "3/4", "6/8"].includes(s.signature) &&
    Array.isArray(s.sections) &&
    s.sections.length > 0 &&
    s.sections.every(
      (section) =>
        typeof section.name === "string" &&
        (section.lyrics === undefined || typeof section.lyrics === "string") &&
        Array.isArray(section.chords) &&
        section.chords.length > 0 &&
        section.chords.every(
          (c) =>
            Number.isInteger(c.bars) &&
            c.bars >= 1 &&
            c.bars <= 32 &&
            (c.bass === undefined || NOTES.includes(c.bass)) &&
            (c.degree !== undefined
              ? Number.isInteger(c.degree) && c.degree >= 0 && c.degree <= 6
              : NOTES.includes(c.root!) &&
                [
                  "major",
                  "minor",
                  "dim",
                  "aug",
                  "maj7",
                  "min7",
                  "7",
                  "sus2",
                  "sus4",
                  "add9",
                ].includes(c.type!)),
        ),
    )
  );
}
