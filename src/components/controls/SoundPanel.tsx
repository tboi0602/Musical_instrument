"use client";
import { SlidersHorizontal, Volume2, VolumeX, Timer } from "lucide-react";
import { useStudio } from "../../store/studio";
import { Range, Select } from "./Fields";
export function SoundPanel() {
  const s = useStudio((x) => x.settings);
  const set = useStudio((x) => x.set);
  return (
    <aside className="panel sound-panel">
      <div className="section-heading">
        <div>
          <SlidersHorizontal size={17} />
          <h2>Điều chỉnh âm thanh</h2>
        </div>
      </div>
      <div className="sound-body">
        <Range
          label="Độ tự nhiên"
          value={s.humanize}
          min={0}
          max={100}
          step={1}
          format={`${s.humanize}%`}
          onChange={(humanize) => set({ humanize })}
        />
        <p className="control-help">
          Biến thiên nhẹ để tiếng đàn tự nhiên hơn.
        </p>
        <Range
          label="Lực đánh"
          value={s.velocity}
          onChange={(velocity) => set({ velocity })}
        />
        {s.instrument === "guitar" ? (
          <Range
            label="Độ trễ giữa các dây"
            value={s.strumMs}
            min={10}
            max={25}
            step={1}
            format={`${s.strumMs} ms`}
            onChange={(strumMs) => set({ strumMs })}
          />
        ) : (
          <div className="piano-settings">
            <Select
              label="THẾ HỢP ÂM"
              value={s.inversion}
              onChange={(v) => set({ inversion: Number(v) as 0 | 1 | 2 })}
            >
              <option value="0">Thế gốc</option>
              <option value="1">Đảo một</option>
              <option value="2">Đảo hai</option>
            </Select>
            <label className="check-label">
              <input
                type="checkbox"
                checked={s.voiceLeading}
                onChange={(e) => set({ voiceLeading: e.target.checked })}
              />
              Tự chọn thế chuyển âm gần
            </label>
          </div>
        )}
        <div className="sound-divider" />
        <div className="metronome-control">
          <span>
            <Timer size={16} />
            Máy đếm nhịp
          </span>
          <button
            className={`toggle ${s.metronome ? "on" : ""}`}
            role="switch"
            aria-checked={s.metronome}
            aria-label="Máy đếm nhịp"
            onClick={() => set({ metronome: !s.metronome })}
          >
            <span />
          </button>
        </div>
        <Range
          label="Âm lượng tiếng nhịp"
          value={s.metronomeVolume}
          onChange={(metronomeVolume) => set({ metronomeVolume })}
        />
        <details className="advanced-sound">
          <summary>Độ ngân và âm lượng</summary>
          <Range
            label="Độ ngân"
            value={s.sustain}
            onChange={(sustain) => set({ sustain })}
          />
          <Range
            label="Thời gian ngân"
            min={0.1}
            max={3}
            step={0.1}
            value={s.duration}
            format={`${s.duration.toFixed(1)} s`}
            onChange={(duration) => set({ duration })}
          />
          <Range
            label="Âm lượng nhạc cụ"
            value={s.instrumentVolume}
            onChange={(instrumentVolume) => set({ instrumentVolume })}
          />
        </details>
        <div className="master-volume">
          <button
            className="icon-button"
            aria-label={s.muted ? "Bật lại tiếng" : "Tắt tiếng"}
            onClick={() => set({ muted: !s.muted })}
          >
            {s.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <Range
            label={s.muted ? "Âm lượng tổng · đang tắt" : "Âm lượng tổng"}
            value={s.volume}
            onChange={(volume) => set({ volume })}
          />
        </div>
      </div>
    </aside>
  );
}
