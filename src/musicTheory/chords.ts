import type {
  Chord,
  ChordType,
  Note,
  Scale,
  ScaleDegree,
} from "../types/music";
import { midiNote, mod, noteIndex } from "./notes";
import { DEGREE_TYPES, generateScale } from "./scales";
export const FORMULAS: Record<ChordType, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  add9: [0, 4, 7, 14],
};
export const SUFFIX: Record<ChordType, string> = {
  major: "",
  minor: "m",
  dim: "dim",
  aug: "aug",
  maj7: "maj7",
  min7: "m7",
  "7": "7",
  sus2: "sus2",
  sus4: "sus4",
  add9: "add9",
};
export function generateChord(
  root: Note,
  type: ChordType = "major",
  octave = 4,
  bass?: Note,
): Chord {
  return {
    root,
    type,
    ...(bass ? { bass } : {}),
    name: root + SUFFIX[type] + (bass ? `/${bass}` : ""),
    notes: FORMULAS[type].map((n) => midiNote(root, octave) + n),
  };
}
/** Place the written bass strictly below all upper voices, including inversions. */
export function chordBassMidi(chord: Chord, upper = chord.notes): number {
  const lowest = Math.min(...upper);
  const distance = mod(lowest - noteIndex(chord.bass ?? chord.root));
  return lowest - (distance || 12);
}
export function degreeChord(
  key: Note,
  scale: Scale,
  degree: ScaleDegree,
  octave = 4,
): Chord {
  return {
    ...generateChord(
      generateScale(key, scale)[degree],
      DEGREE_TYPES[scale][degree],
      octave,
    ),
    degree,
  };
}
export function invert(notes: number[], inversion: number): number[] {
  const result = [...notes];
  for (let i = 0; i < inversion; i++) result.push(result.shift()! + 12);
  return result;
}
export function voiceLead(notes: number[], previous: number[]): number[] {
  if (!previous.length) return notes;
  const candidates = [0, 1, 2].flatMap((i) =>
    [-12, 0, 12].map((o) => invert(notes, i).map((n) => n + o)),
  );
  const cost = (n: number[]) =>
    n.reduce(
      (sum, x, i) =>
        sum + Math.abs(x - previous[Math.min(i, previous.length - 1)]),
      0,
    );
  return candidates.reduce(
    (best, n) => (cost(n) < cost(best) ? n : best),
    notes,
  );
}
