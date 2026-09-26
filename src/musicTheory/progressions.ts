import type {
  ChordType,
  ScaleDegree,
  Song,
  SongChord,
  Note,
  Scale,
} from "../types/music";
import { normalizeNote, noteIndex } from "./notes";
import { degreeChord, generateChord } from "./chords";
import { transposeNote } from "./transpose";
export const PROGRESSIONS = [
  { name: "Vòng hợp âm quen thuộc", value: "I | V | vi | IV" },
  { name: "Đêm dịu êm", value: "vi | IV | I | V" },
  { name: "Ba hợp âm", value: "I | IV | V | I" },
  { name: "Vòng chuyển jazz", value: "ii | V | I:2" },
  { name: "Giai điệu hoài niệm", value: "I | vi | ii | V" },
  { name: "Blues 12 ô nhịp", value: "I:4 | IV:2 | I:2 | V | IV | I:2" },
];
const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii"];
const TYPES: Record<string, ChordType> = {
  "": "major",
  m: "minor",
  dim: "dim",
  "°": "dim",
  aug: "aug",
  "+": "aug",
  maj7: "maj7",
  m7: "min7",
  "7": "7",
  sus2: "sus2",
  sus4: "sus4",
  add9: "add9",
};
export function parseProgression(text: string): SongChord[] {
  const tokens = text
    .trim()
    .split(/[|,\s]+/)
    .filter(Boolean);
  if (!tokens.length) throw new Error("Hãy nhập ít nhất một hợp âm.");
  if (tokens.length > 128) throw new Error("Mỗi đoạn có tối đa 128 hợp âm.");
  return tokens.map((token) => {
    const [symbol, count, extra] = token.split(":");
    const bars = count === undefined ? 1 : Number(count);
    if (extra !== undefined || !Number.isInteger(bars) || bars < 1 || bars > 32)
      throw new Error(`Số ô nhịp không hợp lệ: ${token}. Dùng C:2 hoặc I:2.`);
    const degree = ROMAN.indexOf(symbol.replace("°", "").toLowerCase());
    if (degree >= 0) return { degree: degree as ScaleDegree, bars };
    const match =
      /^([A-G](?:#|b)?)(maj7|m7|dim|aug|sus2|sus4|add9|m|7|°|\+)?(?:\/([A-G](?:#|b)?))?$/.exec(
        symbol,
      );
    if (!match) throw new Error(`Hợp âm không hợp lệ: ${symbol}`);
    return {
      root: normalizeNote(match[1]),
      type: TYPES[match[2] ?? ""],
      bars,
      ...(match[3] ? { bass: normalizeNote(match[3]) } : {}),
    };
  });
}
export function resolveSongChord(
  entry: SongChord,
  sourceKey: Note,
  key: Note,
  scale: Scale,
  octave: number,
) {
  return entry.degree !== undefined
    ? degreeChord(key, scale, entry.degree, octave)
    : generateChord(
        transposeNote(entry.root!, noteIndex(key) - noteIndex(sourceKey)),
        entry.type!,
        octave,
        entry.bass
          ? transposeNote(entry.bass, noteIndex(key) - noteIndex(sourceKey))
          : undefined,
      );
}
export const DEFAULT_SONG: Song = {
  title: "Giai điệu đầu tiên",
  key: "C",
  scale: "major",
  bpm: 80,
  signature: "4/4",
  sections: [
    { name: "Đoạn chính", chords: parseProgression("I | vi | IV | V") },
    { name: "Điệp khúc", chords: parseProgression("IV | V | iii | vi") },
  ],
};
