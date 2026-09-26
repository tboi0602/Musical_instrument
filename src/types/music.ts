export type Note =
  "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";
export type Scale = "major" | "minor";
export type ChordType =
  | "major"
  | "minor"
  | "dim"
  | "aug"
  | "maj7"
  | "min7"
  | "7"
  | "sus2"
  | "sus4"
  | "add9";
export type ScaleDegree = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface Chord {
  root: Note;
  type: ChordType;
  name: string;
  notes: number[];
  degree?: ScaleDegree;
}
export type InstrumentId = "guitar" | "piano";
export type TimeSignature = "4/4" | "3/4" | "6/8";
export type Quantization = "immediate" | "beat" | "bar";
export type Technique =
  | "DOWN"
  | "UP"
  | "BASS"
  | "ROOT"
  | "LOW"
  | "MID"
  | "HIGH"
  | "PICK_1"
  | "PICK_2"
  | "PICK_3"
  | "PICK_4"
  | "PICK_5"
  | "PICK_6"
  | "MUTE"
  | "PALM_MUTE"
  | "SLAP"
  | "REST"
  | "ACCENT_DOWN"
  | "ACCENT_UP"
  | "BLOCK"
  | "THIRD"
  | "FIFTH"
  | "TOP"
  | "OCTAVE";
export interface PatternStep {
  actions: Technique[];
  velocity: number;
}
export interface Pattern {
  id: string;
  name: string;
  instrument: InstrumentId;
  signature: TimeSignature;
  stepsPerBeat: number;
  steps: PatternStep[];
  custom?: boolean;
}
export interface GuitarString {
  string: number;
  fret: number | null;
  midi: number | null;
  muted: boolean;
}
export interface GuitarVoicing {
  chord: string;
  strings: GuitarString[];
}
export interface SongChord {
  degree?: ScaleDegree;
  root?: Note;
  type?: ChordType;
  bars: number;
}
export interface SongSection {
  name: string;
  chords: SongChord[];
}
export interface Song {
  title: string;
  key: Note;
  scale: Scale;
  bpm: number;
  signature: TimeSignature;
  sections: SongSection[];
}
export interface Settings {
  guitarTouch?: Technique;
  pianoTouch?: Technique;
  instrument: InstrumentId;
  key: Note;
  scale: Scale;
  octave: number;
  bpm: number;
  signature: TimeSignature;
  quantization: Quantization;
  playMode: "trigger" | "hold";
  patternId: string;
  humanize: number;
  velocity: number;
  volume: number;
  instrumentVolume: number;
  metronomeVolume: number;
  metronome: boolean;
  muted: boolean;
  sustain: number;
  duration: number;
  strumMs: number;
  inversion: 0 | 1 | 2;
  voiceLeading: boolean;
}
export interface TransportState {
  playing: boolean;
  step: number;
  beat: number;
  bar: number;
  technique: string;
  current: Chord | null;
  queued: Chord | null;
  time: number;
}
