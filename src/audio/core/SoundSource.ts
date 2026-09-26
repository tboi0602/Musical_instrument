import { frequency } from "../../musicTheory/notes";
export interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
  start: number;
  end: number;
}
export interface NoteOptions {
  velocity: number;
  duration: number;
  sustain: number;
  muted?: boolean;
}
export interface SoundSource {
  playNote(midi: number, time: number, options: NoteOptions): void;
  stopNote(midi: number, time: number): void;
  release(time: number): void;
  cancelFrom(time: number): void;
  setVolume(value: number): void;
  dispose(): void;
}

/** Cached, offline-generated samples: a damped delay-line string and an inharmonic piano model. */
export class ModeledSource implements SoundSource {
  private cache = new Map<number, AudioBuffer>();
  private voices = new Map<Voice, number>();
  private output: GainNode;
  constructor(
    private ctx: AudioContext,
    destination: AudioNode,
    private kind: "guitar" | "piano",
  ) {
    this.output = ctx.createGain();
    this.output.connect(destination);
  }
  private sample(midi: number): AudioBuffer {
    const cached = this.cache.get(midi);
    if (cached) return cached;
    const rate = this.ctx.sampleRate;
    const seconds = this.kind === "guitar" ? 3.5 : 5;
    const buffer = this.ctx.createBuffer(1, Math.ceil(seconds * rate), rate);
    const data = buffer.getChannelData(0);
    const hz = frequency(midi);
    if (this.kind === "guitar") {
      const delay = rate / hz;
      const size = Math.ceil(delay) + 2;
      const ring = new Float32Array(size);
      for (let i = 0; i < size; i++) ring[i] = (Math.random() * 2 - 1) * 0.75;
      let previous = 0;
      for (let i = 0; i < data.length; i++) {
        const read = (((i - delay) % size) + size) % size;
        const lo = Math.floor(read);
        const fraction = read - lo;
        const value =
          ring[lo] * (1 - fraction) + ring[(lo + 1) % size] * fraction;
        const filtered = (value * 0.52 + previous * 0.48) * 0.997;
        previous = value;
        ring[i % size] = filtered;
        data[i] =
          filtered *
          Math.min(1, i / (rate * 0.002)) *
          Math.exp((-i / rate) * 0.35);
      }
    } else {
      for (let harmonic = 1; harmonic <= 12; harmonic++) {
        const f = hz * harmonic * Math.sqrt(1 + 0.00012 * harmonic * harmonic);
        if (f >= rate / 2) break;
        const amplitude = 0.42 / harmonic ** 1.65;
        const decay = 1.1 + harmonic * 0.5 + hz / 1800;
        for (let i = 0; i < data.length; i++) {
          const t = i / rate;
          data[i] +=
            Math.sin(2 * Math.PI * f * t) *
            amplitude *
            Math.exp(-t * decay) *
            Math.min(1, t / 0.003);
        }
      }
      for (let i = 0; i < rate * 0.025; i++)
        data[i] += (Math.random() * 2 - 1) * 0.03 * Math.exp((-i / rate) * 180);
    }
    if (this.cache.size > 100)
      this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(midi, buffer);
    return buffer;
  }
  warm(notes: number[]) {
    notes.forEach((n) => this.sample(n));
  }
  playNote(midi: number, time: number, options: NoteOptions) {
    const source = this.ctx.createBufferSource();
    source.buffer = this.sample(midi);
    const gain = this.ctx.createGain();
    const start = Math.max(time, this.ctx.currentTime);
    const duration = options.muted
      ? 0.09
      : Math.max(0.08, options.duration + options.sustain * 1.8);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(options.velocity * 0.65, start + 0.004);
    gain.gain.setTargetAtTime(
      0.0001,
      start + (options.muted ? 0.015 : duration * 0.45),
      Math.max(0.015, duration * 0.16),
    );
    source.connect(gain);
    gain.connect(this.output);
    const voice = { source, gain, start, end: start + duration };
    this.voices.set(voice, midi);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.voices.delete(voice);
    };
    source.start(start);
    source.stop(start + duration + 0.1);
    if (this.voices.size > 128) {
      const oldest = this.voices.keys().next().value!;
      this.stopVoice(oldest, this.ctx.currentTime, 0.015);
    }
  }
  private stopVoice(v: Voice, time: number, release = 0.07) {
    if (v.start >= time) {
      v.source.stop(time);
      return;
    }
    v.gain.gain.cancelAndHoldAtTime(time);
    v.gain.gain.setTargetAtTime(0, time, release / 4);
    v.source.stop(time + release);
  }
  stopNote(midi: number, time: number) {
    this.voices.forEach((note, voice) => {
      if (note === midi) this.stopVoice(voice, time);
    });
  }
  release(time: number) {
    this.voices.forEach((_, v) => this.stopVoice(v, time));
  }
  cancelFrom(time: number) {
    this.voices.forEach((_, v) => {
      if (v.start >= time) this.stopVoice(v, time, 0.01);
    });
  }
  setVolume(value: number) {
    this.output.gain.setTargetAtTime(value, this.ctx.currentTime, 0.015);
  }
  dispose() {
    this.release(this.ctx.currentTime);
    this.output.disconnect();
    this.cache.clear();
  }
}
