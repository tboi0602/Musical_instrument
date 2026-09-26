import { describe, expect, it } from "vitest";
import {
  parseProgression,
  resolveSongChord,
} from "../../src/musicTheory/progressions";
import {
  generateChord,
  chordBassMidi,
  invert,
} from "../../src/musicTheory/chords";
import { transposeChord } from "../../src/musicTheory/transpose";
import {
  guitarVoicing,
  strumStrings,
  bassString,
} from "../../src/audio/instruments/guitar/GuitarVoicing";
import { NOTES, mod } from "../../src/musicTheory/notes";
describe("slash chords", () => {
  it("parses E/D, inversions, accidentals and bar counts", () => {
    expect(parseProgression("E/D:2 | C/G | F#m/C# | Bbmaj7/D")).toEqual([
      { root: "E", type: "major", bass: "D", bars: 2 },
      { root: "C", type: "major", bass: "G", bars: 1 },
      { root: "F#", type: "minor", bass: "C#", bars: 1 },
      { root: "A#", type: "maj7", bass: "D", bars: 1 },
    ]);
    for (const text of ["E/", "E/H", "E/D/G", "/D"])
      expect(() => parseProgression(text)).toThrow();
  });
  it("resolves and transposes both root and bass", () => {
    const entry = parseProgression("E/D")[0];
    expect(resolveSongChord(entry, "C", "C", "major", 4)).toMatchObject({
      name: "E/D",
      bass: "D",
      notes: [64, 68, 71],
    });
    expect(resolveSongChord(entry, "C", "G", "major", 4)).toMatchObject({
      name: "B/A",
      bass: "A",
    });
    expect(
      transposeChord(generateChord("E", "major", 4, "D"), 2),
    ).toMatchObject({ name: "F#/E", bass: "E" });
  });
  it("keeps written piano bass below every inversion", () => {
    const c = generateChord("E", "major", 4, "D");
    for (const inversion of [0, 1, 2]) {
      const upper = invert(c.notes, inversion);
      const bass = chordBassMidi(c, upper);
      expect(mod(bass)).toBe(2);
      expect(bass).toBeLessThan(Math.min(...upper));
    }
  });
  it("guitar uses the written bass while preserving chord tones across keys", () => {
    for (const root of NOTES)
      for (const bass of NOTES) {
        const chord = generateChord(root, "major", 4, bass),
          v = guitarVoicing(chord),
          notes = strumStrings(v).map((s) => s.midi!);
        expect(mod(Math.min(...notes)), chord.name).toBe(NOTES.indexOf(bass));
        expect(
          chord.notes.every((n) => notes.some((x) => mod(x) === mod(n))),
          chord.name,
        ).toBe(true);
        expect(mod(bassString(v, bass)!.midi!)).toBe(NOTES.indexOf(bass));
      }
  });
});
