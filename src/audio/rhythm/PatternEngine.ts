import type {
  Pattern,
  Technique,
  TimeSignature,
  Quantization,
} from "../../types/music";
export const GUITAR_ACTIONS: Technique[] = [
  "DOWN",
  "UP",
  "BASS",
  "PICK_1",
  "PICK_2",
  "PICK_3",
  "PICK_4",
  "PICK_5",
  "PICK_6",
  "MUTE",
  "PALM_MUTE",
  "SLAP",
  "ACCENT_DOWN",
  "ACCENT_UP",
  "ROOT",
  "LOW",
  "MID",
  "HIGH",
  "REST",
];
export const PIANO_ACTIONS: Technique[] = [
  "BLOCK",
  "ROOT",
  "THIRD",
  "FIFTH",
  "TOP",
  "OCTAVE",
  "LOW",
  "MID",
  "HIGH",
  "REST",
];
export const meter = (signature: TimeSignature) => ({
  beats: Number(signature.split("/")[0]),
  denominator: Number(signature.split("/")[1]),
});
// BPM always counts quarter notes; a 6/8 bar is three quarter-note beats.
export const beatSeconds = (bpm: number, signature: TimeSignature) =>
  ((60 / bpm) * 4) / meter(signature).denominator;
export const stepSeconds = (
  bpm: number,
  signature: TimeSignature,
  subdivision: number,
) => beatSeconds(bpm, signature) / subdivision;
export function quantizedStep(
  nextStep: number,
  subdivision: number,
  steps: number,
  mode: Quantization,
): number {
  const unit = mode === "bar" ? steps : mode === "beat" ? subdivision : 1;
  return Math.ceil(nextStep / unit) * unit;
}
export function validatePattern(p: Pattern): string | null {
  if (
    !p ||
    !["guitar", "piano"].includes(p.instrument) ||
    !["4/4", "3/4", "6/8"].includes(p.signature) ||
    ![1, 2, 4].includes(p.stepsPerBeat)
  )
    return "Invalid instrument, meter, or subdivision.";
  if (
    !Array.isArray(p.steps) ||
    p.steps.length !== meter(p.signature).beats * p.stepsPerBeat
  )
    return "Pattern must contain exactly one full bar.";
  const allowed = p.instrument === "guitar" ? GUITAR_ACTIONS : PIANO_ACTIONS;
  for (const step of p.steps)
    if (
      !step ||
      !Array.isArray(step.actions) ||
      !step.actions.length ||
      step.actions.some((a) => !allowed.includes(a)) ||
      !Number.isFinite(step.velocity) ||
      step.velocity < 0 ||
      step.velocity > 1
    )
      return "Invalid action or velocity.";
  return null;
}
export function adaptPattern(
  pattern: Pattern,
  signature: TimeSignature,
  subdivision = pattern.stepsPerBeat,
): Pattern {
  const length = meter(signature).beats * subdivision;
  return {
    ...pattern,
    signature,
    stepsPerBeat: subdivision,
    steps: Array.from({ length }, (_, i) => {
      const old = (i * pattern.stepsPerBeat) / subdivision;
      return Number.isInteger(old) && old < pattern.steps.length
        ? { ...pattern.steps[old], actions: [...pattern.steps[old].actions] }
        : { actions: ["REST"], velocity: 0.8 };
    }),
  };
}
export const timeline = (p: Pattern, bpm: number) =>
  p.steps.map((step, i) => ({
    ...step,
    time: i * stepSeconds(bpm, p.signature, p.stepsPerBeat),
  }));
