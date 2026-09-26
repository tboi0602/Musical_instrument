import type { Settings, Technique } from "../types/music";
export const GUITAR_TOUCHES: Technique[] = [
  "DOWN",
  "UP",
  "PALM_MUTE",
  "BASS",
  "PICK_1",
  "PICK_2",
  "PICK_3",
  "PICK_4",
  "PICK_5",
  "PICK_6",
  "MUTE",
  "SLAP",
];
export const PIANO_TOUCHES: Technique[] = [
  "BLOCK",
  "OCTAVE",
  "ROOT",
  "THIRD",
  "FIFTH",
  "TOP",
];
export const TECHNIQUE_VI: Record<string, string> = {
  DOWN: "Quạt xuống",
  UP: "Quạt lên",
  PALM_MUTE: "Quạt chặn dây",
  BASS: "Gảy nốt trầm",
  PICK_1: "Gảy dây 1",
  PICK_2: "Gảy dây 2",
  PICK_3: "Gảy dây 3",
  PICK_4: "Gảy dây 4",
  PICK_5: "Gảy dây 5",
  PICK_6: "Gảy dây 6",
  MUTE: "Chặn dây",
  SLAP: "Vỗ dây",
  BLOCK: "Đánh cả hợp âm",
  OCTAVE: "Hợp âm và quãng tám",
  ROOT: "Nốt gốc",
  THIRD: "Nốt bậc ba",
  FIFTH: "Nốt bậc năm",
  TOP: "Nốt gốc cao",
  REST: "Chờ lần nhấn tiếp theo",
};
export function manualTechnique(s: Settings): Technique {
  const allowed = s.instrument === "guitar" ? GUITAR_TOUCHES : PIANO_TOUCHES;
  const selected = s.instrument === "guitar" ? s.guitarTouch : s.pianoTouch;
  return selected && allowed.includes(selected) ? selected : allowed[0];
}
