import { describe, it, expect } from "vitest";
import { generateScale } from "../../src/musicTheory/scales";
import {
  degreeChord,
  generateChord,
  FORMULAS,
  invert,
  voiceLead,
} from "../../src/musicTheory/chords";
import { transposeChord } from "../../src/musicTheory/transpose";
import { normalizeNote, NOTES, mod } from "../../src/musicTheory/notes";
import {
  parseProgression,
  resolveSongChord,
} from "../../src/musicTheory/progressions";
import type { ChordType, ScaleDegree } from "../../src/types/music";
describe("Music theory", () => {
  it("generates major and natural minor scales", () => {
    expect(generateScale("C", "major")).toEqual([
      "C",
      "D",
      "E",
      "F",
      "G",
      "A",
      "B",
    ]);
    expect(generateScale("G", "major")).toEqual([
      "G",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F#",
    ]);
    expect(generateScale("A", "minor")).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
    ]);
  });
  it("maps degrees to diatonic quality in every key", () => {
    for (const key of NOTES)
      for (const scale of ["major", "minor"] as const) {
        const pcs = generateScale(key, scale);
        for (let d = 0; d < 7; d++) {
          const c = degreeChord(key, scale, d as ScaleDegree);
          expect(c.notes.every((n) => pcs.includes(NOTES[mod(n)]))).toBe(true);
        }
      }
    expect(
      Array.from(
        { length: 7 },
        (_, i) => degreeChord("C", "major", i as ScaleDegree).name,
      ),
    ).toEqual(["C", "Dm", "Em", "F", "G", "Am", "Bdim"]);
    expect(degreeChord("G", "major", 6).name).toBe("F#dim");
    expect(degreeChord("A", "minor", 1).name).toBe("Bdim");
  });
  it("generates all ten chord formulas", () => {
    for (const type of Object.keys(FORMULAS) as ChordType[])
      expect(generateChord("C", type).notes).toEqual(
        FORMULAS[type].map((n) => 60 + n),
      );
    expect(generateChord("C", "maj7").notes).toEqual([60, 64, 67, 71]);
    expect(generateChord("C", "7").notes).toEqual([60, 64, 67, 70]);
    expect(generateChord("C", "sus4").notes).toEqual([60, 65, 67]);
  });
  it("normalizes enharmonics and transposes across octave boundaries", () => {
    expect(normalizeNote("Db")).toBe("C#");
    expect(transposeChord(generateChord("B"), 2)).toMatchObject({
      name: "C#",
      notes: [73, 77, 80],
    });
    expect(transposeChord(generateChord("C"), -2).name).toBe("A#");
  });
  it("inverts chords and minimizes voice movement", () => {
    expect(invert([60, 64, 67], 1)).toEqual([64, 67, 72]);
    expect(invert([60, 64, 67], 2)).toEqual([67, 72, 76]);
    expect(voiceLead([69, 72, 76], [60, 64, 67])).toEqual([60, 64, 69]);
  });
  it("parses named chords, degrees, and bar durations", () => {
    expect(parseProgression("I | vi:2 | IV | V")[1]).toEqual({
      degree: 5,
      bars: 2,
    });
    expect(parseProgression("Dbmaj7 Am F G7")[0]).toEqual({
      root: "C#",
      type: "maj7",
      bars: 1,
    });
    expect(
      resolveSongChord(parseProgression("C")[0], "C", "G", "major", 4).name,
    ).toBe("G");
    expect(
      resolveSongChord(parseProgression("vi")[0], "C", "G", "major", 4).name,
    ).toBe("Em");
  });
  it("rejects malformed songs", () => {
    for (const text of ["", "K", "I:0", "C:2:3", "Am:1.5", "C:99"])
      expect(() => parseProgression(text)).toThrow();
  });
});
