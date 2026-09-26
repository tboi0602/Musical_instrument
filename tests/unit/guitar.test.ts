import { describe, it, expect } from "vitest";
import {
  guitarVoicing,
  strumStrings,
  bassString,
} from "../../src/audio/instruments/guitar/GuitarVoicing";
import { generateChord, FORMULAS } from "../../src/musicTheory/chords";
import { NOTES, mod } from "../../src/musicTheory/notes";
import type { ChordType } from "../../src/types/music";
describe("Guitar voicing and techniques", () => {
  it("uses the C open voicing and excludes muted low E", () => {
    const v = guitarVoicing(generateChord("C"));
    expect(v.strings.map((s) => s.fret)).toEqual([null, 3, 2, 0, 1, 0]);
    expect(strumStrings(v).map((s) => s.midi)).toEqual([48, 52, 55, 60, 64]);
  });
  it("strums down from low to high and up in reverse order", () => {
    const v = guitarVoicing(generateChord("G"));
    expect(strumStrings(v).map((s) => s.string)).toEqual([6, 5, 4, 3, 2, 1]);
    expect(strumStrings(v, true).map((s) => s.string)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });
  it("selects root bass strings for C, G, and D", () => {
    for (const [root, string] of [
      ["C", 5],
      ["G", 6],
      ["D", 4],
    ] as const)
      expect(bassString(guitarVoicing(generateChord(root)), root)?.string).toBe(
        string,
      );
  });
  it("generates only chord tones and covers every formula for all roots", () => {
    for (const root of NOTES)
      for (const type of Object.keys(FORMULAS) as ChordType[]) {
        const chord = generateChord(root, type);
        const strings = strumStrings(guitarVoicing(chord));
        const pcs = chord.notes.map((n) => mod(n));
        expect(
          strings.every((s) => pcs.includes(mod(s.midi!))),
          chord.name,
        ).toBe(true);
        expect(
          pcs.every((pc) => strings.some((s) => mod(s.midi!) === pc)),
          chord.name,
        ).toBe(true);
        expect(mod(bassString(guitarVoicing(chord), root)!.midi!)).toBe(
          NOTES.indexOf(root),
        );
      }
  });
  it("transposes the whole guitar range with octave", () => {
    expect(
      strumStrings(guitarVoicing(generateChord("C"), 3)).map((s) => s.midi),
    ).toEqual([36, 40, 43, 48, 52]);
  });
});
