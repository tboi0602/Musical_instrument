import type { Note, Scale, ChordType } from "../types/music";
import { NOTES, mod, noteIndex } from "./notes";
export const SCALE_INTERVALS: Record<Scale, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};
export const DEGREE_TYPES: Record<Scale, ChordType[]> = {
  major: ["major", "minor", "minor", "major", "major", "minor", "dim"],
  minor: ["minor", "dim", "major", "minor", "minor", "major", "major"],
};
export const ROMANS: Record<Scale, string[]> = {
  major: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  minor: ["i", "ii°", "III", "iv", "v", "VI", "VII"],
};
export const KEYBOARD = ["A", "S", "D", "F", "G", "H", "J"];
export const generateScale = (root: Note, scale: Scale): Note[] =>
  SCALE_INTERVALS[scale].map((n) => NOTES[mod(noteIndex(root) + n)]);
