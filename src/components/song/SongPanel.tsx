"use client";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { useStudio } from "../../store/studio";
import { audioEngine } from "../../audio/core/AudioEngine";
import {
  parseProgression,
  PROGRESSIONS,
  resolveSongChord,
} from "../../musicTheory/progressions";
import { ROMANS } from "../../musicTheory/scales";
import { SUFFIX } from "../../musicTheory/chords";
import { NOTES } from "../../musicTheory/notes";
import { playChord } from "../keyboard/ChordKeyboard";
import { LyricsEditor } from "./LyricsEditor";
import { playableChords } from "../../musicTheory/keyboard";
import type { Note, Scale, Song, TimeSignature } from "../../types/music";
function draftOf(song: Song) {
  return song.sections.map((section) => ({
    name: section.name,
    lyrics: section.lyrics ?? "",
    text: section.chords
      .map(
        (c) =>
          `${c.degree !== undefined ? ROMANS[song.scale][c.degree] : c.root! + SUFFIX[c.type!]}${c.bass ? `/${c.bass}` : ""}${c.bars === 1 ? "" : `:${c.bars}`}`,
      )
      .join(" | "),
  }));
}
export function SongPanel() {
  const song = useStudio((x) => x.song),
    s = useStudio((x) => x.settings);
  const [title, setTitle] = useState(song.title);
  const [sections, setSections] = useState(() => draftOf(song));
  const [sourceKey, setSourceKey] = useState(song.key);
  const [sourceScale, setSourceScale] = useState(song.scale);
  const [bpm, setBpm] = useState(song.bpm);
  const [signature, setSignature] = useState(song.signature);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [position, setPosition] = useState(0);

  const entries = useMemo(
    () =>
      song.sections.flatMap((section) =>
        section.chords.map((entry) => ({
          ...entry,
          section: section.name,
          chord: resolveSongChord(entry, song.key, s.key, s.scale, s.octave),
        })),
      ),
    [song, s.key, s.scale, s.octave],
  );
  const current = Math.min(position, entries.length - 1);
  const next = entries[(current + 1) % entries.length];
  function keyboardFor(name: string) {
    const binding = playableChords(s, "song", song).find(
      (item) => item.chord.name === name,
    );
    return binding?.code ? `Nhấn ${binding.key}` : "Chạm để đánh";
  }
  function save() {
    try {
      const updated: Song = {
        title: title.trim() || "Bài hát chưa đặt tên",
        key: sourceKey,
        scale: sourceScale,
        bpm,
        signature,
        sections: sections.map((section) => ({
          name: section.name.trim() || "Đoạn",
          lyrics: section.lyrics,
          chords: parseProgression(section.text),
        })),
      };
      useStudio.getState().setSong(updated);
      useStudio
        .getState()
        .set({ key: sourceKey, scale: sourceScale, bpm, signature });
      audioEngine.stop();
      setPosition(0);
      setEditing(false);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bài hát không hợp lệ");
    }
  }
  return (
    <section className="panel song-panel">
      <div className="section-heading">
        <div>
          <BookOpen size={17} />
          <h2>{song.title}</h2>
          <span className="tag">HƯỚNG DẪN HỢP ÂM</span>
        </div>
        <div className="inline-actions">
          <button className="text-button" onClick={() => setPosition(0)}>
            <RotateCcw size={13} />
            Về đầu bài
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              if (!editing)
                setSections(
                  sections.map((section, i) => ({
                    ...section,
                    lyrics: song.sections[i]?.lyrics ?? section.lyrics,
                  })),
                );
              setEditing(!editing);
            }}
          >
            {editing ? "Đóng trình sửa" : "Sửa bài hát"}
          </button>
        </div>
      </div>
      <div className="song-summary">
        <span>
          {entries[current].section} · hợp âm {current + 1}/{entries.length}
        </span>
        <span>Bạn tự đánh hợp âm và quyết định nhịp.</span>
      </div>
      <div className="song-cards">
        {entries.map((entry, i) => (
          <button
            key={i}
            className={`song-card ${current === i ? "expected" : ""}`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              setPosition(i);
              playChord(entry.chord);
            }}
            onPointerUp={() => audioEngine.release(entry.chord.name)}
            onPointerCancel={() => audioEngine.release(entry.chord.name)}
            onLostPointerCapture={() => audioEngine.release(entry.chord.name)}
            onKeyDown={(e) => {
              if (["Enter", " "].includes(e.key) && !e.repeat) {
                e.preventDefault();
                playChord(entry.chord);
              }
            }}
            onKeyUp={(e) => {
              if (["Enter", " "].includes(e.key))
                audioEngine.release(entry.chord.name);
            }}
          >
            <span>
              {entry.section} · {entry.bars} ô nhịp
            </span>
            <strong>{entry.chord.name}</strong>
            <small>{keyboardFor(entry.chord.name)}</small>
            {current === i && <b>ĐANG XEM</b>}
          </button>
        ))}
      </div>
      <div className="song-guide">
        <button
          className="secondary-button"
          onClick={() =>
            setPosition((current + entries.length - 1) % entries.length)
          }
        >
          Trước
        </button>
        <button
          className="secondary-button"
          onClick={() => setPosition((current + 1) % entries.length)}
        >
          Tiếp
        </button>
        <span>
          Trước đó{" "}
          <b>
            {
              entries[(current + entries.length - 1) % entries.length].chord
                .name
            }
          </b>
        </span>
        <span>
          Đang xem <b>{entries[current].chord.name}</b>
        </span>
        <span>
          <ArrowRight size={14} />
          Tiếp theo <b>{next.chord.name}</b> · {keyboardFor(next.chord.name)}
        </span>
      </div>
      {editing && (
        <div className="song-editor">
          <div className="song-meta">
            <label className="field">
              <span>TÊN BÀI HÁT</span>
              <input
                value={title}
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="field">
              <span>GIỌNG GỐC</span>
              <select
                value={sourceKey}
                onChange={(e) => setSourceKey(e.target.value as Note)}
              >
                {NOTES.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>ÂM GIAI</span>
              <select
                value={sourceScale}
                onChange={(e) => setSourceScale(e.target.value as Scale)}
              >
                <option value="major">Trưởng</option>
                <option value="minor">Thứ</option>
              </select>
            </label>
            <label className="field">
              <span>BPM</span>
              <input
                type="number"
                min={40}
                max={240}
                value={bpm}
                onChange={(e) =>
                  setBpm(
                    Math.max(40, Math.min(240, Number(e.target.value) || 80)),
                  )
                }
              />
            </label>
            <label className="field">
              <span>SỐ CHỈ NHỊP</span>
              <select
                value={signature}
                onChange={(e) => setSignature(e.target.value as TimeSignature)}
              >
                {["4/4", "3/4", "6/8"].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="muted">
            Nhập tên hợp âm hoặc bậc: C | Am | E/D | G/B hoặc I | vi | IV | V.
            Phần sau dấu / là nốt trầm. Thêm :2 cho hai ô nhịp. Đổi giọng chính
            để chuyển tông cả bài.
          </p>
          {sections.map((section, i) => (
            <div key={i} className="section-editor">
              <input
                aria-label={`Tên đoạn ${i + 1}`}
                value={section.name}
                maxLength={40}
                onChange={(e) =>
                  setSections(
                    sections.map((x, n) =>
                      n === i ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
              />
              <textarea
                aria-label={`Hợp âm đoạn ${i + 1}`}
                value={section.text}
                onChange={(e) =>
                  setSections(
                    sections.map((x, n) =>
                      n === i ? { ...x, text: e.target.value } : x,
                    ),
                  )
                }
              />
              <button
                className="icon-button"
                disabled={sections.length === 1}
                aria-label={`Xóa đoạn ${i + 1}`}
                onClick={() => setSections(sections.filter((_, n) => n !== i))}
              >
                <Trash2 size={16} />
              </button>
              <label className="lyrics-field">
                <span>Lời bài hát · {section.name || `Đoạn ${i + 1}`}</span>
                <textarea
                  aria-label={`Lời bài hát đoạn ${i + 1}`}
                  rows={5}
                  value={section.lyrics}
                  placeholder="Nhập hoặc dán lời bài hát tại đây…"
                  onChange={(e) =>
                    setSections(
                      sections.map((x, n) =>
                        n === i ? { ...x, lyrics: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
            </div>
          ))}
          <div className="song-editor-actions">
            <button
              className="secondary-button"
              onClick={() =>
                setSections([
                  ...sections,
                  { name: "Đoạn chuyển", text: "IV | V | I:2", lyrics: "" },
                ])
              }
            >
              <Plus size={14} />
              Thêm đoạn
            </button>
            <select
              aria-label="Gợi ý vòng hợp âm"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value)
                  setSections(
                    sections.map((section, index) =>
                      index === 0
                        ? { ...section, text: e.target.value }
                        : section,
                    ),
                  );
              }}
            >
              <option value="" disabled>
                Gợi ý vòng hợp âm
              </option>
              {PROGRESSIONS.map((p) => (
                <option key={p.name} value={p.value}>
                  {p.name}
                </option>
              ))}
            </select>
            <button className="primary-button" onClick={save}>
              <Save size={14} />
              Lưu bài hát
            </button>
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
      {!editing && <LyricsEditor />}
    </section>
  );
}
