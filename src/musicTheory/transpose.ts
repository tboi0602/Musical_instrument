import type { Chord, Note } from "../types/music";
import { NOTES, mod, noteIndex } from "./notes";
import { SUFFIX } from "./chords";
export const transposeNote = (note: Note, semitones: number): Note =>
  NOTES[mod(noteIndex(note) + semitones)];
export function transposeChord(chord: Chord, semitones: number): Chord {
  const root = transposeNote(chord.root, semitones);
  return {
    ...chord,
    root,
    name: root + SUFFIX[chord.type],
    notes: chord.notes.map((n) => n + semitones),
  };
}
