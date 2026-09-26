import { expect, it } from "vitest";
import { playableChords } from "../../src/musicTheory/keyboard";
import { DEFAULT_SETTINGS } from "../../src/store/studio";
import {
  DEFAULT_SONG,
  parseProgression,
} from "../../src/musicTheory/progressions";
it("assigns all song chords unique keys, preserving familiar degrees and deduplicating repeats", () => {
  const song = {
    ...DEFAULT_SONG,
    sections: [
      {
        name: "Đoạn",
        chords: parseProgression(
          "C | E/D | Am | C | G/B | F | D7 | Cmaj7 | Bm | F#m",
        ),
      },
    ],
  };
  const mapped = playableChords(DEFAULT_SETTINGS, "song", song);
  expect(mapped).toHaveLength(9);
  expect(mapped.find((x) => x.chord.name === "C")?.key).toBe("A");
  expect(mapped.find((x) => x.chord.name === "Am")?.key).toBe("H");
  expect(mapped.find((x) => x.chord.name === "E/D")?.key).toBe("K");
  expect(new Set(mapped.map((x) => `${x.code}:${x.shift}`)).size).toBe(
    mapped.length,
  );
  expect(mapped.every((x) => x.code)).toBe(true);
});
