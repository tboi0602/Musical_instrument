import type { Chord, Settings, Song, ScaleDegree } from "../types/music";
import { degreeChord } from "./chords";
import { KEYBOARD } from "./scales";
import { resolveSongChord } from "./progressions";
export interface PlayableChord {
  chord: Chord;
  key: string;
  code: string;
  shift: boolean;
}
const EXTRA_KEYS = "KLQWERTYUIOPZXCVBNM1234567890".split("");
export function playableChords(
  settings: Settings,
  mode: "free" | "song",
  song: Song,
): PlayableChord[] {
  const base = KEYBOARD.map((key, i) => ({
    key,
    code: `Key${key}`,
    shift: false,
    chord: degreeChord(
      settings.key,
      settings.scale,
      i as ScaleDegree,
      settings.octave,
    ),
  }));
  if (mode === "free") return base;
  const unique = new Map<string, Chord>();
  song.sections.forEach((section) =>
    section.chords.forEach((entry) => {
      const chord = resolveSongChord(
        entry,
        song.key,
        settings.key,
        settings.scale,
        settings.octave,
      );
      unique.set(chord.name, chord);
    }),
  );
  const available = [
    ...EXTRA_KEYS.map((key) => ({ key, shift: false })),
    ...[...KEYBOARD, ...EXTRA_KEYS].map((key) => ({ key, shift: true })),
  ];
  let extra = 0;
  return [...unique.values()].map((chord) => {
    const familiar = base.find((item) => item.chord.name === chord.name);
    if (familiar) return { ...familiar, chord };
    const assigned = available[extra++];
    if (!assigned) return { chord, key: "Chạm", code: "", shift: false };
    return {
      chord,
      key: assigned.shift ? `Shift+${assigned.key}` : assigned.key,
      code: /\d/.test(assigned.key)
        ? `Digit${assigned.key}`
        : `Key${assigned.key}`,
      shift: assigned.shift,
    };
  });
}
