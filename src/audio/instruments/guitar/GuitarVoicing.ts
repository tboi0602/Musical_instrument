import type { Chord, GuitarVoicing, GuitarString } from "../../../types/music";
import { mod, noteIndex } from "../../../musicTheory/notes";
export const TUNING = [40, 45, 50, 55, 59, 64];
export const OPEN_VOICINGS: Record<string, (number | null)[]> = {
  C: [null, 3, 2, 0, 1, 0],
  G: [3, 2, 0, 0, 0, 3],
  Am: [null, 0, 2, 2, 1, 0],
  Em: [0, 2, 2, 0, 0, 0],
  D: [null, null, 0, 2, 3, 2],
  Dm: [null, null, 0, 2, 3, 1],
  E: [0, 2, 2, 1, 0, 0],
  A: [null, 0, 2, 2, 2, 0],
  F: [1, 3, 3, 2, 1, 1],
  Bm: [null, 2, 4, 4, 3, 2],
  Bdim: [null, 2, 3, 4, 3, null],
  Cmaj7: [null, 3, 2, 0, 0, 0],
  C7: [null, 3, 2, 3, 1, 3],
  G7: [3, 2, 0, 0, 0, 1],
  D7: [null, null, 0, 2, 1, 2],
  A7: [null, 0, 2, 0, 2, 0],
  Am7: [null, 0, 2, 0, 1, 0],
  Em7: [0, 2, 0, 0, 0, 0],
  Asus2: [null, 0, 2, 2, 0, 0],
  Dsus4: [null, null, 0, 2, 3, 3],
  Cadd9: [null, 3, 2, 0, 3, 0],
};
export function guitarVoicing(chord: Chord, octave = 4): GuitarVoicing {
  let frets = OPEN_VOICINGS[chord.name];
  if (!frets && (chord.type === "major" || chord.type === "minor")) {
    const eFret = mod(noteIndex(chord.root) - 4);
    const aFret = mod(noteIndex(chord.root) - 9);
    frets =
      eFret <= aFret
        ? [0, 2, 2, chord.type === "major" ? 1 : 0, 0, 0].map((f) => f + eFret)
        : [null, 0, 2, 2, chord.type === "major" ? 2 : 1, 0].map((f) =>
            f === null ? null : f + aFret,
          );
  }
  if (!frets) {
    // Search compact chord-tone voicings, enforcing a root bass and full formula coverage.
    const pcs = [...new Set(chord.notes.map((n) => mod(n)))];
    let best: (number | null)[] | undefined;
    let bestCost = Infinity;
    for (let base = 0; base <= 12; base++) {
      const options = TUNING.map(
        (n) =>
          [
            null,
            ...Array.from({ length: 5 }, (_, i) => base + i).filter((f) =>
              pcs.includes(mod(n + f)),
            ),
          ] as (number | null)[],
      );
      const search = (index: number, candidate: (number | null)[]) => {
        if (index < 6) {
          for (const f of options[index]) search(index + 1, [...candidate, f]);
          return;
        }
        const sounding = candidate.flatMap((f, i) =>
          f === null ? [] : [TUNING[i] + f],
        );
        if (
          sounding.length < 3 ||
          mod(sounding[0]) !== noteIndex(chord.root) ||
          !pcs.every((pc) => sounding.some((n) => mod(n) === pc))
        )
          return;
        const cost =
          base * 0.8 +
          candidate.filter((f) => f === null).length * 2 +
          candidate.reduce<number>((s, f) => s + (f ?? 0) * 0.04, 0);
        if (cost < bestCost) {
          best = candidate;
          bestCost = cost;
        }
      };
      search(0, []);
    }
    frets =
      best ??
      TUNING.map((n) => {
        const f = Array.from({ length: 13 }, (_, i) => i).find((i) =>
          pcs.includes(mod(n + i)),
        );
        return f ?? null;
      });
  }
  return {
    chord: chord.name,
    strings: frets.map((fret, i) => ({
      string: 6 - i,
      fret,
      muted: fret === null,
      midi: fret === null ? null : TUNING[i] + fret + (octave - 4) * 12,
    })),
  };
}
export const strumStrings = (
  voicing: GuitarVoicing,
  up = false,
): GuitarString[] => {
  const strings = voicing.strings.filter((s) => !s.muted && s.midi !== null);
  return up ? strings.reverse() : strings;
};
export function bassString(
  voicing: GuitarVoicing,
  root: string,
): GuitarString | undefined {
  const playable = strumStrings(voicing);
  return (
    playable.find((s) => mod(s.midi!) === noteIndex(root as Chord["root"])) ??
    playable[0]
  );
}
