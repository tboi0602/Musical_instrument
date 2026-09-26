import type { Note } from "../types/music";
export const NOTES: Note[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const ALIASES: Record<string, Note> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
  Cb: "B",
  Fb: "E",
  "B#": "C",
  "E#": "F",
};
export const mod = (n: number, m = 12) => ((n % m) + m) % m;
export function normalizeNote(value: string): Note {
  const n = ALIASES[value] ?? value;
  if (!NOTES.includes(n as Note)) throw new Error(`Unknown note: ${value}`);
  return n as Note;
}
export const noteIndex = (note: Note) => NOTES.indexOf(note);
export const midiNote = (note: Note, octave: number) =>
  (octave + 1) * 12 + noteIndex(note);
export const midiName = (midi: number) =>
  `${NOTES[mod(midi)]}${Math.floor(midi / 12) - 1}`;
export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
