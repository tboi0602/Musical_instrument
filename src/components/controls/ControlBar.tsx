"use client";
import { useRef, useState } from "react";
import { Guitar, Piano, Hand } from "lucide-react";
import { useStudio } from "../../store/studio";
import { NOTES } from "../../musicTheory/notes";
import type { Note, Scale, TimeSignature } from "../../types/music";
import { Select } from "./Fields";
export function ControlBar() {
  const s = useStudio((x) => x.settings);
  const update = useStudio((x) => x.set);
  const taps = useRef<number[]>([]);
  const [tempoDraft, setTempoDraft] = useState("");
  const [editingTempo, setEditingTempo] = useState(false);
  function tap() {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 4000), now].slice(
      -5,
    );
    if (taps.current.length > 1)
      update({
        bpm: Math.max(
          40,
          Math.min(
            240,
            Math.round(
              (60000 * (taps.current.length - 1)) / (now - taps.current[0]),
            ),
          ),
        ),
      });
  }
  return (
    <section className="control-bar" aria-label="Thiết lập nhạc cụ">
      <div className="instrument-control">
        <span className="control-label">NHẠC CỤ</span>
        <div className="segmented">
          <button
            aria-pressed={s.instrument === "guitar"}
            className={s.instrument === "guitar" ? "selected" : ""}
            onClick={() => update({ instrument: "guitar" })}
          >
            <Guitar size={17} /> Guitar
          </button>
          <button
            aria-pressed={s.instrument === "piano"}
            className={s.instrument === "piano" ? "selected" : ""}
            onClick={() => update({ instrument: "piano" })}
          >
            <Piano size={17} /> Piano
          </button>
        </div>
      </div>
      <Select
        label="GIỌNG"
        value={s.key}
        onChange={(v) => update({ key: v as Note })}
      >
        {NOTES.map((n) => (
          <option key={n}>{n}</option>
        ))}
      </Select>
      <Select
        label="ÂM GIAI"
        value={s.scale}
        onChange={(v) => update({ scale: v as Scale })}
      >
        <option value="major">Trưởng</option>
        <option value="minor">Thứ</option>
      </Select>
      <Select
        label="QUÃNG TÁM"
        value={s.octave}
        onChange={(v) => update({ octave: Number(v) })}
      >
        {[2, 3, 4, 5].map((n) => (
          <option key={n}>{n}</option>
        ))}
      </Select>
      <div className="tempo-control">
        <label className="field">
          <span>TỐC ĐỘ NHỊP</span>
          <div className="tempo-value">
            <input
              aria-label="BPM"
              type="number"
              min={40}
              max={240}
              value={editingTempo ? tempoDraft : s.bpm}
              onFocus={() => {
                setTempoDraft(String(s.bpm));
                setEditingTempo(true);
              }}
              onChange={(e) => {
                setTempoDraft(e.target.value);
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 40 && n <= 240)
                  update({ bpm: Math.round(n) });
              }}
              onBlur={() => {
                const n = Number(tempoDraft);
                update({
                  bpm:
                    Number.isFinite(n) && tempoDraft
                      ? Math.max(40, Math.min(240, Math.round(n)))
                      : s.bpm,
                });
                setEditingTempo(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
            <small>BPM</small>
            <button className="tap" onClick={tap} aria-label="Gõ để đặt nhịp">
              <Hand size={14} /> GÕ
            </button>
          </div>
        </label>
        <input
          aria-label="Thanh chỉnh tốc độ nhịp"
          type="range"
          min={40}
          max={240}
          value={s.bpm}
          onChange={(e) => update({ bpm: Number(e.target.value) })}
        />
      </div>
      <Select
        label="SỐ CHỈ NHỊP"
        value={s.signature}
        onChange={(v) => update({ signature: v as TimeSignature })}
      >
        {["4/4", "3/4", "6/8"].map((n) => (
          <option key={n}>{n}</option>
        ))}
      </Select>
      <div className="manual-mode">
        <span className="control-label">CÁCH CHƠI</span>
        <strong>Nhấn một lần</strong>
      </div>
    </section>
  );
}
