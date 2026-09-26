"use client";
import { FileText } from "lucide-react";
import { useStudio } from "../../store/studio";

export function LyricsEditor() {
  const song = useStudio((state) => state.song);
  const setSong = useStudio((state) => state.setSong);
  return (
    <section className="panel lyrics-panel" aria-label="Nhập lời bài hát">
      <div className="section-heading">
        <div>
          <FileText size={17} />
          <h2>Lời bài hát</h2>
        </div>
        <span className="muted">Tự lưu trên thiết bị</span>
      </div>
      <div className="song-lyrics">
        {song.sections.map((section, index) => (
          <label key={index} className="lyrics-field">
            <span>{section.name}</span>
            <textarea
              aria-label={`Nhập lời bài hát đoạn ${index + 1}`}
              rows={6}
              placeholder="Nhập hoặc dán lời bài hát vào đây…"
              value={section.lyrics ?? ""}
              onChange={(event) =>
                setSong({
                  ...song,
                  sections: song.sections.map((item, i) =>
                    i === index
                      ? { ...item, lyrics: event.target.value }
                      : item,
                  ),
                })
              }
            />
          </label>
        ))}
      </div>
    </section>
  );
}
