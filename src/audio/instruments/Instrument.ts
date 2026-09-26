import type { Chord, Settings, Technique } from "../../types/music";
export interface Instrument {
  perform(
    actions: Technique[],
    chord: Chord,
    time: number,
    velocity: number,
    settings: Settings,
  ): void;
  prepare(chords: Chord[], settings: Settings): void;
  release(time: number): void;
  cancelFrom(time: number): void;
  setVolume(volume: number): void;
  dispose(): void;
}
