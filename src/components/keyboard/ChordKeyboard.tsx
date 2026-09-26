"use client";
import { useSyncExternalStore } from "react";
import { Keyboard } from "lucide-react";
import { audioEngine } from "../../audio/core/AudioEngine";
import { useStudio } from "../../store/studio";
import { degreeChord } from "../../musicTheory/chords";
import { KEYBOARD, ROMANS } from "../../musicTheory/scales";
import type { Chord, ScaleDegree } from "../../types/music";
export function playChord(chord: Chord) {
  try {
    audioEngine.trigger(chord);
  } catch (error) {
    useStudio.setState({
      message:
        error instanceof Error ? error.message : "Không thể phát âm thanh.",
    });
  }
}
export function ChordKeyboard() {
  const s = useStudio((x) => x.settings);
  const transport = useSyncExternalStore(
    audioEngine.subscribe,
    audioEngine.getSnapshot,
    audioEngine.getServerSnapshot,
  );
  return (
    <section className="keyboard-panel">
      <div className="section-heading">
        <div>
          <Keyboard size={17} />
          <h2>Bàn phím hợp âm</h2>
          <span className="muted desktop-only">Tự nhấn, tự giữ nhịp.</span>
        </div>
        <span className="tag">MỖI LẦN NHẤN = MỘT LẦN ĐÁNH</span>
      </div>
      <div className="chord-pads">
        {KEYBOARD.map((key, i) => {
          const chord = degreeChord(s.key, s.scale, i as ScaleDegree, s.octave);
          const active =
            transport.playing && transport.current?.name === chord.name;
          const queued = transport.queued?.name === chord.name;
          return (
            <button
              key={key}
              aria-label={`Đánh ${chord.name}, phím ${key}`}
              aria-pressed={active}
              className={`chord-pad ${active ? "active" : ""} ${queued ? "queued" : ""}`}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                playChord(chord);
              }}
              onPointerUp={() => audioEngine.release(chord.name)}
              onPointerCancel={() => audioEngine.release(chord.name)}
              onLostPointerCapture={() => audioEngine.release(chord.name)}
              onKeyDown={(e) => {
                if (["Enter", " "].includes(e.key) && !e.repeat) {
                  e.preventDefault();
                  playChord(chord);
                }
              }}
              onKeyUp={(e) => {
                if (["Enter", " "].includes(e.key))
                  audioEngine.release(chord.name);
              }}
            >
              <span className="pad-top">
                <span>{ROMANS[s.scale][i]}</span>
                <kbd>{key}</kbd>
              </span>
              <strong>{chord.name}</strong>
              <span className="pad-quality">
                {queued
                  ? "ĐANG CHỜ"
                  : active
                    ? "ĐANG NGÂN"
                    : chord.type === "dim"
                      ? "Giảm"
                      : chord.type === "minor"
                        ? "Thứ"
                        : "Trưởng"}
              </span>
              <span className="pad-light" />
            </button>
          );
        })}
      </div>
      <div className="keyboard-caption">
        <span>
          <span className="key-hint">A S D F G H J</span> để đánh ·{" "}
          <kbd>Space</kbd> để dừng
        </span>
        <span>Cùng phím bấm cho mọi giọng.</span>
      </div>
    </section>
  );
}
