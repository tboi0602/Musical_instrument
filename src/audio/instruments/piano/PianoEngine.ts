import type { Chord, Settings, Technique } from "../../../types/music";
import type { Instrument } from "../Instrument";
import { invert, voiceLead } from "../../../musicTheory/chords";
import { ModeledSource } from "../../core/SoundSource";
export class PianoEngine implements Instrument {
  private source: ModeledSource;
  private previous: number[] = [];
  private name = "";
  private notes: number[] = [];
  constructor(ctx: AudioContext, destination: AudioNode) {
    this.source = new ModeledSource(ctx, destination, "piano");
  }
  prepare(chords: Chord[], s: Settings) {
    this.source.warm([
      ...new Set(
        chords.flatMap((c) => [
          ...c.notes,
          ...c.notes.map((n) => n + 12),
          c.notes[0] - 12,
        ]),
      ),
    ]);
    this.name = "";
    this.previous = [];
    this.notes = [];
    void s;
  }
  perform(
    actions: Technique[],
    chord: Chord,
    time: number,
    velocity: number,
    s: Settings,
  ) {
    const key = `${chord.name}:${chord.notes[0]}:${s.inversion}:${s.voiceLeading}`;
    if (key !== this.name) {
      this.notes = s.voiceLeading
        ? voiceLead(chord.notes, this.previous)
        : invert(chord.notes, s.inversion);
      this.previous = this.notes;
      this.name = key;
    }
    const n = this.notes;
    for (const action of actions) {
      if (action === "REST") continue;
      const notes =
        action === "BLOCK"
          ? n
          : action === "OCTAVE"
            ? [chord.notes[0] - 12, chord.notes[0], ...n.slice(1)]
            : [
                action === "THIRD" || action === "MID"
                  ? n[1]
                  : action === "FIFTH"
                    ? n[2]
                    : action === "TOP" || action === "HIGH"
                      ? n[0] + 12
                      : action === "LOW"
                        ? chord.notes[0] - 12
                        : n[0],
              ];
      notes.forEach((note) =>
        this.source.playNote(
          note,
          time + (Math.random() * 0.008 * s.humanize) / 100,
          {
            velocity:
              velocity *
              (1 + ((Math.random() - 0.5) * 0.12 * s.humanize) / 100),
            duration: s.duration,
            sustain: s.sustain,
          },
        ),
      );
    }
  }
  release(time: number) {
    this.source.release(time);
  }
  cancelFrom(time: number) {
    this.source.cancelFrom(time);
  }
  setVolume(v: number) {
    this.source.setVolume(v);
  }
  dispose() {
    this.source.dispose();
  }
}
