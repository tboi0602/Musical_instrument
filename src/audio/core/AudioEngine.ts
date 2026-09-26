import type {
  Chord,
  Settings,
  Pattern,
  TransportState,
  InstrumentId,
} from "../../types/music";
import type { Instrument } from "../instruments/Instrument";
import { GuitarEngine } from "../instruments/guitar/GuitarEngine";
import { PianoEngine } from "../instruments/piano/PianoEngine";
import { Scheduler } from "./Scheduler";
import { beatSeconds, meter } from "../rhythm/PatternEngine";
import { degreeChord } from "../../musicTheory/chords";
import { manualTechnique } from "../manual";

const STOPPED: TransportState = {
  playing: false,
  step: -1,
  beat: 0,
  bar: 0,
  technique: "REST",
  current: null,
  queued: null,
  time: 0,
};
type Listener = () => void;

/** A key press is one attack. The scheduler is exclusively a metronome clock. */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private clickBus: GainNode | null = null;
  private instruments = new Map<InstrumentId, Instrument>();
  private settings: Settings | null = null;
  private metronome: Scheduler | null = null;
  private clockRunning = false;
  private beatEvents: { time: number; step: number }[] = [];
  private clicks = new Set<OscillatorNode>();
  private listeners = new Set<Listener>();
  private state = STOPPED;
  private ringUntil = 0;
  private frame: number | null = null;
  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.state;
  getServerSnapshot = () => STOPPED;
  private publish(state: TransportState) {
    this.state = state;
    this.listeners.forEach((fn) => fn());
  }
  get enabled() {
    return this.ctx?.state === "running";
  }
  async enable(settings: Settings, pattern?: Pattern) {
    if (typeof window === "undefined" || !window.AudioContext)
      throw new Error(
        "Trình duyệt chưa hỗ trợ âm thanh Web Audio. Hãy dùng Chrome, Edge, Firefox hoặc Safari mới.",
      );
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.clickBus = this.ctx.createGain();
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.ratio.value = 4;
      this.master.connect(compressor);
      compressor.connect(this.ctx.destination);
      this.clickBus.connect(this.master);
      this.instruments.set("guitar", new GuitarEngine(this.ctx, this.master));
      this.instruments.set("piano", new PianoEngine(this.ctx, this.master));
      this.metronome = new Scheduler(
        () => this.ctx!.currentTime,
        () => beatSeconds(this.settings!.bpm, this.settings!.signature),
        (step, time) => {
          this.click(time, step % meter(this.settings!.signature).beats === 0);
          this.beatEvents.push({ step, time });
        },
      );
    }
    await this.ctx.resume();
    this.configure(settings, pattern);
  }
  configure(settings: Settings, pattern?: Pattern) {
    // Saved patterns remain compatible but can never start accompaniment.
    void pattern;
    const old = this.settings;
    this.settings = settings;
    if (!this.ctx) return;
    this.master?.gain.setTargetAtTime(
      settings.muted ? 0 : settings.volume,
      this.ctx.currentTime,
      0.015,
    );
    this.clickBus?.gain.setTargetAtTime(
      settings.metronomeVolume,
      this.ctx.currentTime,
      0.015,
    );
    this.instruments.forEach((i) => i.setVolume(settings.instrumentVolume));
    if (
      !old ||
      old.instrument !== settings.instrument ||
      old.key !== settings.key ||
      old.scale !== settings.scale ||
      old.octave !== settings.octave
    ) {
      this.instruments.get(settings.instrument)?.prepare(
        Array.from({ length: 7 }, (_, i) =>
          degreeChord(
            settings.key,
            settings.scale,
            i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            settings.octave,
          ),
        ),
        settings,
      );
    }
    // Settings never play a chord. Only the metronome setting drives the clock.
    if (old?.signature !== settings.signature && this.clockRunning)
      this.stopClock();
    if (settings.metronome && !this.clockRunning) {
      this.clockRunning = true;
      this.metronome?.start();
      this.ensureFrame();
    } else if (!settings.metronome) this.stopClock();
  }
  trigger(chord: Chord) {
    if (!this.enabled || !this.settings)
      throw new Error("Hãy nhấn Bật âm thanh trước khi chơi.");
    const s = this.settings,
      time = this.ctx!.currentTime + 0.004,
      technique = manualTechnique(s);
    this.instruments
      .get(s.instrument)!
      .perform([technique], chord, time, s.velocity, s);
    // Tail length is visual feedback only; it never schedules another attack.
    const damped = ["MUTE", "SLAP", "PALM_MUTE"].includes(technique);
    this.ringUntil = Math.max(
      this.ringUntil,
      time + (damped ? 0.22 : s.duration + s.sustain * 1.8 + 0.24),
    );
    this.publish({
      ...this.state,
      playing: true,
      current: chord,
      queued: null,
      technique,
      time,
    });
    this.ensureFrame();
  }
  /** Key release never truncates a single attack, including legacy Hold preferences. */
  release(chordName: string) {
    void chordName;
  }
  private ensureFrame() {
    if (this.frame === null) this.frame = requestAnimationFrame(this.animate);
  }
  private animate = () => {
    this.frame = null;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    let next = this.state;
    while (this.beatEvents.length && this.beatEvents[0].time <= now) {
      const event = this.beatEvents.shift()!,
        beats = meter(this.settings!.signature).beats;
      next = {
        ...next,
        step: event.step % beats,
        beat: event.step % beats,
        bar: Math.floor(event.step / beats),
      };
    }
    if (next.playing && now >= this.ringUntil)
      next = { ...next, playing: false, technique: "REST" };
    if (next !== this.state) this.publish(next);
    if (this.state.playing || this.clockRunning) this.ensureFrame();
  };
  private click(time: number, accent: boolean) {
    const ctx = this.ctx!,
      source = ctx.createOscillator(),
      gain = ctx.createGain();
    source.frequency.value = accent ? 1400 : 950;
    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
    source.connect(gain);
    gain.connect(this.clickBus!);
    this.clicks.add(source);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.clicks.delete(source);
    };
    source.start(time);
    source.stop(time + 0.05);
  }
  private stopClock() {
    this.metronome?.stop();
    this.clockRunning = false;
    this.beatEvents = [];
    if (this.ctx)
      this.clicks.forEach((source) => source.stop(this.ctx!.currentTime));
  }
  stop() {
    this.stopClock();
    this.ringUntil = 0;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    if (this.ctx)
      this.instruments.forEach((i) => i.release(this.ctx!.currentTime));
    this.publish({ ...STOPPED, current: this.state.current });
  }
  panic() {
    this.stop();
    this.publish(STOPPED);
  }
  dispose() {
    this.stop();
    this.instruments.forEach((i) => i.dispose());
    this.instruments.clear();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.clickBus = null;
    this.metronome = null;
    this.settings = null;
  }
}
export const audioEngine = new AudioEngine();
