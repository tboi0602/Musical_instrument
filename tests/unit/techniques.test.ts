import { describe, it, expect, vi, beforeEach } from "vitest";
import { GuitarEngine } from "../../src/audio/instruments/guitar/GuitarEngine";
import { PianoEngine } from "../../src/audio/instruments/piano/PianoEngine";
import { generateChord } from "../../src/musicTheory/chords";
import type { Settings } from "../../src/types/music";
const calls = vi.hoisted(() => ({
  playNote: vi.fn(),
  release: vi.fn(),
  cancelFrom: vi.fn(),
  warm: vi.fn(),
  setVolume: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock("../../src/audio/core/SoundSource", () => ({
  ModeledSource: class {
    playNote = calls.playNote;
    release = calls.release;
    cancelFrom = calls.cancelFrom;
    warm = calls.warm;
    setVolume = calls.setVolume;
    dispose = calls.dispose;
  },
}));
const settings: Settings = {
  instrument: "guitar",
  key: "C",
  scale: "major",
  octave: 4,
  bpm: 80,
  signature: "4/4",
  quantization: "beat",
  playMode: "trigger",
  patternId: "g-acoustic",
  humanize: 0,
  velocity: 0.8,
  volume: 0.75,
  instrumentVolume: 0.85,
  metronomeVolume: 0.45,
  metronome: false,
  muted: false,
  sustain: 0.5,
  duration: 1,
  strumMs: 16,
  inversion: 0,
  voiceLeading: false,
};
function context() {
  return {
    sampleRate: 44100,
    currentTime: 0,
    createBuffer: (_c: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
      buffer: null,
    }),
    createGain: () => ({
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
  } as unknown as AudioContext;
}
beforeEach(() => vi.clearAllMocks());
describe("Instrument scheduling", () => {
  it("plays E/D with D underneath the piano chord and on guitar bass", () => {
    const chord = generateChord("E", "major", 4, "D");
    const piano = new PianoEngine(context(), {} as AudioNode);
    piano.perform(["BLOCK"], chord, 1, 0.8, settings);
    expect(calls.playNote.mock.calls.map((c) => c[0])).toEqual([
      62, 64, 68, 71,
    ]);
    calls.playNote.mockClear();
    const guitar = new GuitarEngine(context(), {} as AudioNode);
    guitar.perform(["BASS"], chord, 2, 0.8, settings);
    expect(calls.playNote.mock.calls).toHaveLength(1);
    expect(calls.playNote.mock.calls[0][0] % 12).toBe(2);
  });
  it("separates downstroke strings by the requested milliseconds", () => {
    const guitar = new GuitarEngine(context(), {} as AudioNode);
    guitar.perform(["DOWN"], generateChord("C"), 1, 0.8, settings);
    expect(calls.playNote.mock.calls.map((c) => c[0])).toEqual([
      48, 52, 55, 60, 64,
    ]);
    expect(calls.playNote.mock.calls.map((c) => c[1])).toEqual([
      1, 1.016, 1.032, 1.048, 1.064,
    ]);
  });
  it("reverses an upstroke and keeps the bass on the correct string", () => {
    const guitar = new GuitarEngine(context(), {} as AudioNode);
    guitar.perform(["UP"], generateChord("C"), 1, 0.8, settings);
    expect(calls.playNote.mock.calls.map((c) => c[0])).toEqual([
      64, 60, 55, 52, 48,
    ]);
    calls.playNote.mockClear();
    guitar.perform(["BASS"], generateChord("D"), 2, 0.8, settings);
    expect(calls.playNote.mock.calls[0][0]).toBe(50);
  });
  it("plays independent simultaneous picking and ignores muted strings", () => {
    const guitar = new GuitarEngine(context(), {} as AudioNode);
    guitar.perform(
      ["PICK_6", "PICK_3", "PICK_2"],
      generateChord("C"),
      1,
      0.8,
      settings,
    );
    expect(calls.playNote.mock.calls.map((c) => c[0])).toEqual([55, 60]);
    expect(calls.playNote.mock.calls.map((c) => c[1])).toEqual([1, 1]);
  });
  it("palm mutes use a damped envelope and accent attacks are stronger", () => {
    const guitar = new GuitarEngine(context(), {} as AudioNode);
    guitar.perform(["PALM_MUTE"], generateChord("C"), 1, 0.7, settings);
    expect(calls.playNote.mock.calls[0][2].muted).toBe(true);
    const quiet = calls.playNote.mock.calls[0][2].velocity;
    calls.playNote.mockClear();
    guitar.perform(["ACCENT_DOWN"], generateChord("C"), 2, 0.7, settings);
    expect(calls.playNote.mock.calls[0][2].velocity).toBeGreaterThan(quiet);
  });
  it("mute damps voices and rest is silent", () => {
    const guitar = new GuitarEngine(context(), {} as AudioNode);
    guitar.perform(["REST"], generateChord("C"), 1, 0.8, settings);
    expect(calls.playNote).not.toHaveBeenCalled();
    guitar.perform(["MUTE"], generateChord("C"), 2, 0.8, settings);
    expect(calls.release).toHaveBeenCalledWith(2);
  });
  it("piano block chords share an onset; broken steps pick the requested tones", () => {
    const piano = new PianoEngine(context(), {} as AudioNode);
    piano.perform(["BLOCK"], generateChord("C"), 1, 0.8, settings);
    expect(calls.playNote.mock.calls.map((c) => c[0])).toEqual([60, 64, 67]);
    expect(calls.playNote.mock.calls.every((c) => c[1] === 1)).toBe(true);
    calls.playNote.mockClear();
    piano.perform(["THIRD", "TOP"], generateChord("C"), 2, 0.8, settings);
    expect(calls.playNote.mock.calls.map((c) => c[0])).toEqual([64, 72]);
  });
});
