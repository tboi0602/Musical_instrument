import type {
  Chord,
  Settings,
  Technique,
  GuitarVoicing,
} from "../../../types/music";
import type { Instrument } from "../Instrument";
import { ModeledSource } from "../../core/SoundSource";
import { guitarVoicing, bassString, strumStrings } from "./GuitarVoicing";
export class GuitarEngine implements Instrument {
  private source: ModeledSource;
  private voicings = new Map<string, GuitarVoicing>();
  private noise: AudioBuffer;
  private hits = new Set<AudioBufferSourceNode>();
  constructor(
    private ctx: AudioContext,
    private destination: AudioNode,
  ) {
    this.source = new ModeledSource(ctx, destination, "guitar");
    this.noise = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * 0.12),
      ctx.sampleRate,
    );
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.exp((-i / ctx.sampleRate) * 45);
  }
  private voicing(chord: Chord, octave: number) {
    const key = `${chord.name}:${octave}`;
    if (!this.voicings.has(key))
      this.voicings.set(key, guitarVoicing(chord, octave));
    return this.voicings.get(key)!;
  }
  prepare(chords: Chord[], settings: Settings) {
    for (const chord of chords)
      this.source.warm(
        strumStrings(this.voicing(chord, settings.octave)).map((s) => s.midi!),
      );
  }
  perform(
    actions: Technique[],
    chord: Chord,
    time: number,
    velocity: number,
    s: Settings,
  ) {
    const v = this.voicing(chord, s.octave);
    const all = strumStrings(v);
    const human = s.humanize / 100;
    for (const action of actions) {
      if (action === "REST") continue;
      if (action === "MUTE" || action === "SLAP") {
        this.source.release(time);
        const src = this.ctx.createBufferSource();
        src.buffer = this.noise;
        const gain = this.ctx.createGain();
        gain.gain.value =
          velocity * s.instrumentVolume * (action === "SLAP" ? 0.6 : 0.22);
        src.connect(gain);
        gain.connect(this.destination);
        this.hits.add(src);
        src.onended = () => {
          src.disconnect();
          gain.disconnect();
          this.hits.delete(src);
        };
        src.start(time);
        continue;
      }
      const up = action === "UP" || action === "ACCENT_UP";
      const strum = [
        "DOWN",
        "UP",
        "ACCENT_DOWN",
        "ACCENT_UP",
        "PALM_MUTE",
      ].includes(action);
      const strings = strum
        ? strumStrings(v, up)
        : action.startsWith("PICK_")
          ? all.filter((x) => x.string === Number(action.slice(5)))
          : ["BASS", "ROOT", "LOW"].includes(action)
            ? [
                bassString(
                  v,
                  action === "ROOT" ? chord.root : (chord.bass ?? chord.root),
                ),
              ].filter((x) => x !== undefined)
            : [
                all[
                  action === "MID" ? Math.floor(all.length / 2) : all.length - 1
                ],
              ].filter(Boolean);
      const spacing =
        (s.strumMs / 1000) * (1 + (Math.random() - 0.5) * 0.2 * human);
      strings.forEach((string, i) =>
        this.source.playNote(
          string.midi!,
          time + (strum ? i * spacing : 0) + Math.random() * 0.006 * human,
          {
            velocity: Math.min(
              1,
              velocity *
                (action.startsWith("ACCENT")
                  ? 1.25
                  : action === "PALM_MUTE"
                    ? 0.65
                    : 1) *
                (1 + (Math.random() - 0.5) * 0.18 * human),
            ),
            duration: s.duration,
            sustain: s.sustain,
            muted: action === "PALM_MUTE",
          },
        ),
      );
    }
  }
  release(time: number) {
    this.source.release(time);
    this.hits.forEach((s) => s.stop(time));
  }
  cancelFrom(time: number) {
    this.source.cancelFrom(time);
    this.hits.forEach((s) => s.stop(time));
  }
  setVolume(v: number) {
    this.source.setVolume(v);
  }
  dispose() {
    this.release(this.ctx.currentTime);
    this.source.dispose();
  }
}
