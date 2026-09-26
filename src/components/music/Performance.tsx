"use client";
import { useMemo, useSyncExternalStore } from "react";
import { ArrowRight, AudioLines } from "lucide-react";
import { audioEngine } from "../../audio/core/AudioEngine";
import { useStudio } from "../../store/studio";
import { degreeChord } from "../../musicTheory/chords";
import { midiName } from "../../musicTheory/notes";
import { guitarVoicing } from "../../audio/instruments/guitar/GuitarVoicing";
import { TECHNIQUE_VI, manualTechnique } from "../../audio/manual";
import { meter } from "../../audio/rhythm/PatternEngine";
export function Performance() {
  const s = useStudio((x) => x.settings);
  const t = useSyncExternalStore(
    audioEngine.subscribe,
    audioEngine.getSnapshot,
    audioEngine.getServerSnapshot,
  );
  const activeChord = t.current;
  const chord = useMemo(
    () => activeChord ?? degreeChord(s.key, s.scale, 0, s.octave),
    [activeChord, s.key, s.scale, s.octave],
  );
  const voicing = useMemo(
    () => guitarVoicing(chord, s.octave),
    [chord, s.octave],
  );
  return (
    <section className="performance">
      <div className="chord-display">
        <span className="eyebrow">
          <span className={`status-dot ${t.playing ? "live" : ""}`} />
          {t.playing ? "ĐANG NGÂN" : "SẴN SÀNG ĐỂ CHƠI"}
        </span>
        <div className="current-chord" data-testid="current-chord">
          {chord.root}
          <span>{chord.name.slice(chord.root.length)}</span>
        </div>
        <div className="chord-notes">
          {chord.notes.map((n) => midiName(n).replace(/\d/g, "")).join("  ·  ")}
          <span>
            {chord.type === "major"
              ? "Hợp âm trưởng"
              : chord.type === "minor"
                ? "Hợp âm thứ"
                : {
                    dim: "Hợp âm giảm",
                    aug: "Hợp âm tăng",
                    maj7: "Trưởng bảy",
                    min7: "Thứ bảy",
                    "7": "Bảy át",
                    sus2: "Treo bậc hai",
                    sus4: "Treo bậc bốn",
                    add9: "Thêm bậc chín",
                  }[chord.type]}
          </span>
        </div>
      </div>
      <div
        className="instrument-visual"
        aria-label={`Thế bấm ${s.instrument} cho hợp âm ${chord.name}`}
      >
        {s.instrument === "guitar" ? (
          <div className={`fretboard ${t.playing ? "sounding" : ""}`}>
            <div className="fret-numbers">
              <span>BUÔNG</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
            {[...voicing.strings].reverse().map((string) => (
              <div
                className="guitar-string"
                key={string.string}
                style={
                  {
                    "--thickness": `${0.55 + string.string * 0.28}px`,
                  } as React.CSSProperties
                }
              >
                <span className="string-label">
                  {["E", "B", "G", "D", "A", "E"][string.string - 1]}
                </span>
                <div className="string-track">
                  {[0, 1, 2, 3, 4, 5].map((f) => (
                    <span className="fret" key={f}>
                      {(string.fret === f ||
                        (string.fret !== null &&
                          string.fret > 5 &&
                          f === 5)) && (
                        <i>{string.fret === 0 ? "○" : string.fret}</i>
                      )}
                      {string.muted && f === 0 && <b>×</b>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="instrument-caption">
              <GuitarCaption />{" "}
              <span>
                {voicing.strings
                  .map((v) => (v.fret === null ? "x" : v.fret))
                  .join(" ")}{" "}
                · lên dây chuẩn
              </span>
            </div>
          </div>
        ) : (
          <div className="piano-visual">
            <div className="piano-keys">
              {Array.from({ length: 24 }, (_, i) => {
                const n = 48 + i;
                const black = [1, 3, 6, 8, 10].includes(n % 12);
                return (
                  <div
                    key={n}
                    className={`${black ? "black-key" : "white-key"} ${chord.notes.some((note) => note % 12 === n % 12) ? "note-on" : ""}`}
                  >
                    {!black && <span>{midiName(n).replace(/\d/g, "")}</span>}
                  </div>
                );
              })}
            </div>
            <div className="instrument-caption">
              PHÍM ĐÀN PIANO{" "}
              <span>
                {s.inversion === 0
                  ? "Thế gốc"
                  : `Đảo ${s.inversion === 1 ? "một" : "hai"}`}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="next-display">
        <span className="eyebrow">
          BẠN GIỮ NHỊP <ArrowRight size={13} />
        </span>
        <strong>1 lần</strong>
        <span>Mỗi lần nhấn, đánh một hợp âm</span>
        <div className="mini-meter">
          <AudioLines size={17} />
          <span>
            {t.playing
              ? TECHNIQUE_VI[t.technique]
              : TECHNIQUE_VI[manualTechnique(s)]}
          </span>
        </div>
      </div>
      <div className="beat-strip">
        <span className="bar-label">
          {s.metronome ? "ĐẾM NHỊP" : "TỰ GIỮ NHỊP"}
        </span>
        <div className="beat-cells">
          {Array.from({ length: meter(s.signature).beats }, (_, i) => (
            <div
              key={i}
              className={`beat-cell ${s.metronome && t.step === i ? "current" : ""}`}
            >
              <span>{i + 1}</span>
              <b>{s.metronome && t.step === i ? "●" : "·"}</b>
            </div>
          ))}
        </div>
        <span className="meter-label">
          {s.signature}
          <small>{s.bpm} BPM</small>
        </span>
      </div>
    </section>
  );
}
function GuitarCaption() {
  return <span>DÂY ĐÀN GUITAR</span>;
}
