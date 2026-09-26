"use client";
import { Hand } from "lucide-react";
import { useStudio } from "../../store/studio";
import {
  GUITAR_TOUCHES,
  PIANO_TOUCHES,
  TECHNIQUE_VI,
  manualTechnique,
} from "../../audio/manual";
export function ManualPlayPanel() {
  const s = useStudio((x) => x.settings),
    update = useStudio((x) => x.set);
  const choices = s.instrument === "guitar" ? GUITAR_TOUCHES : PIANO_TOUCHES;
  return (
    <section className="panel manual-panel">
      <div className="section-heading">
        <div>
          <Hand size={17} />
          <h2>Cách đánh mỗi lần nhấn</h2>
        </div>
        <span className="tag">CHƠI THỦ CÔNG</span>
      </div>
      <div className="manual-body">
        <p>
          Mỗi lần nhấn một phím là một lần đánh. Bạn tự quyết định nhịp, khoảng
          nghỉ và thời điểm chuyển hợp âm.
        </p>
        <div className="touch-options">
          {choices.map((technique) => (
            <button
              key={technique}
              className={`secondary-button ${manualTechnique(s) === technique ? "selected" : ""}`}
              aria-pressed={manualTechnique(s) === technique}
              onClick={() =>
                update(
                  s.instrument === "guitar"
                    ? { guitarTouch: technique }
                    : { pianoTouch: technique },
                )
              }
            >
              {TECHNIQUE_VI[technique]}
            </button>
          ))}
        </div>
        <div className="manual-example">
          <strong>
            Thử nhấn: <kbd>A</kbd> <kbd>A</kbd> <kbd>H</kbd> <kbd>H</kbd>
          </strong>
          <p>
            Ở giọng Đô trưởng, bạn sẽ đánh C hai lần rồi Am hai lần. Dừng nhấn
            là dừng đánh; âm đã phát vẫn ngân tự nhiên.
          </p>
        </div>
        <p className="muted">
          Giữ phím không lặp lại. Muốn đánh thêm, hãy nhả rồi nhấn lại. Máy đếm
          nhịp chỉ phát tiếng nhịp khi bạn bật.
        </p>
      </div>
    </section>
  );
}
