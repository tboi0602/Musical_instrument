"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  AudioLines,
  Headphones,
  Power,
  Square,
  CircleHelp,
  X,
  ArrowUpRight,
  Music2,
  Keyboard,
  ShieldAlert,
} from "lucide-react";
import { useStudio } from "../store/studio";
import { audioEngine } from "../audio/core/AudioEngine";
import { playableChords } from "../musicTheory/keyboard";
import { ControlBar } from "./controls/ControlBar";
import { SoundPanel } from "./controls/SoundPanel";
import { ChordKeyboard, playChord } from "./keyboard/ChordKeyboard";
import { Performance } from "./music/Performance";
import { ManualPlayPanel } from "./music/ManualPlayPanel";
import { SongPanel } from "./song/SongPanel";
import { LyricsEditor } from "./song/LyricsEditor";
function editable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (!!target.closest(
      'input,textarea,select,[contenteditable="true"],[role="textbox"]',
    ) ||
      target.isContentEditable)
  );
}
function stopAudio(panic = false) {
  useStudio.getState().set({ metronome: false });
  if (panic) audioEngine.panic();
  else audioEngine.stop();
}
export default function Studio() {
  const status = useStudio((x) => x.audioStatus),
    message = useStudio((x) => x.message),
    mode = useStudio((x) => x.mode),
    onboarded = useStudio((x) => x.onboarded),
    hydrated = useStudio((x) => x.hydrated);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    if (!help) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHelp(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="dialog"] button, [role="dialog"] a, [role="dialog"] input',
        ),
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [help]);
  useEffect(() => {
    useStudio.getState().hydrate();
    const unsubscribe = useStudio.subscribe((state, previous) => {
      if (
        (state.settings !== previous.settings ||
          state.pattern !== previous.pattern) &&
        audioEngine.enabled
      ) {
        try {
          audioEngine.configure(state.settings, state.pattern);
        } catch (e) {
          useStudio.setState({
            message:
              e instanceof Error
                ? e.message
                : "Thiết lập âm thanh không hợp lệ.",
          });
        }
      }
    });
    const held = new Map<string, string>();
    const down = (e: KeyboardEvent) => {
      if (
        e.repeat ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        editable(e.target) ||
        document.querySelector('[role="dialog"]')
      )
        return;
      if (e.code === "Escape") {
        stopAudio(true);
        return;
      }
      if (e.code === "Space" && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        stopAudio();
        return;
      }
      const state = useStudio.getState();
      const binding = playableChords(
        state.settings,
        state.mode,
        state.song,
      ).find((item) => item.code === e.code && item.shift === e.shiftKey);
      if (!binding) return;
      e.preventDefault();
      const chord = binding.chord;
      held.set(e.code, chord.name);
      playChord(chord);
    };
    const up = (e: KeyboardEvent) => {
      const name = held.get(e.code);
      if (name) {
        audioEngine.release(name);
        held.delete(e.code);
      }
    };
    const blur = () => {
      held.clear();
      stopAudio();
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      unsubscribe();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      audioEngine.dispose();
    };
  }, []);
  async function enable() {
    useStudio.setState({ audioStatus: "loading", message: "" });
    try {
      const s = useStudio.getState();
      await audioEngine.enable(s.settings, s.pattern);
      useStudio.setState({ audioStatus: "ready", onboarded: true });
      useStudio.getState().persist();
    } catch (e) {
      useStudio.setState({
        audioStatus: "error",
        message:
          e instanceof Error
            ? e.message
            : "Không thể khởi tạo âm thanh. Vui lòng thử lại.",
      });
    }
  }
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link className="brand" href="/" aria-label="Trang chủ Chordroom">
          <span className="brand-mark">
            <AudioLines size={25} />
          </span>
          chordroom<span className="brand-studio">PHÒNG NHẠC</span>
        </Link>
        <div className="header-center">
          <span className="status-dot" /> Tự tay chơi. Theo nhịp của bạn.
        </div>
        <div className="header-actions">
          <span className="headphone-tip">
            <Headphones size={15} />
            Nên sử dụng tai nghe
          </span>
          <button
            className="icon-button"
            aria-label="Hướng dẫn chơi"
            onClick={() => setHelp(true)}
          >
            <CircleHelp size={20} />
          </button>
        </div>
      </header>
      <main>
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">PHÒNG NHẠC CỦA BẠN</span>
            <h1>Một phím. Một lần đánh.</h1>
            <p>Bạn tự chơi hợp âm và giữ nhịp theo cách của mình.</p>
          </div>
          <div className="audio-actions">
            <AudioStatus />
            {status !== "ready" && (
              <button
                className="primary-button"
                disabled={status === "loading" || !hydrated}
                onClick={enable}
              >
                <Power size={16} />
                {status === "loading"
                  ? "Đang chuẩn bị âm thanh…"
                  : status === "error"
                    ? "Thử bật lại âm thanh"
                    : "Bật âm thanh"}
              </button>
            )}
          </div>
        </div>
        <ControlBar />
        <div className="workspace-tabs">
          <div className="mode-tabs">
            <button
              className={mode === "free" ? "active" : ""}
              aria-pressed={mode === "free"}
              onClick={() => useStudio.setState({ mode: "free" })}
            >
              <Keyboard size={16} />
              Chơi tự do
            </button>
            <button
              className={mode === "song" ? "active" : ""}
              aria-pressed={mode === "song"}
              onClick={() => useStudio.setState({ mode: "song" })}
            >
              <Music2 size={16} />
              Bài hát
            </button>
          </div>
          <div className="transport-actions">
            <button onClick={() => stopAudio()}>
              <Square size={13} />
              Dừng <kbd>Space</kbd>
            </button>
            <button
              className="panic"
              onClick={() => stopAudio(true)}
              title="Tắt mọi âm đang ngân"
            >
              <ShieldAlert size={13} />
              Tắt khẩn cấp
            </button>
          </div>
        </div>
        {message && (
          <div role="status" className="notice">
            {message}
            <button
              aria-label="Đóng thông báo"
              onClick={() => useStudio.setState({ message: "" })}
            >
              <X size={15} />
            </button>
          </div>
        )}
        <Performance />
        <ChordKeyboard />
        {mode === "song" && hydrated && <SongPanel />}
        {mode === "free" && hydrated && <LyricsEditor />}
        <div className="lower-workspace">
          <ManualPlayPanel />
          <SoundPanel />
        </div>
        {!onboarded && (
          <div className="first-play">
            <span className="first-play-icon">
              <Keyboard size={22} />
            </span>
            <div>
              <strong>Tự chơi bài đầu tiên chỉ với vài phím.</strong>
              <p>
                Bật âm thanh rồi thử <kbd>A</kbd> <kbd>A</kbd> <kbd>H</kbd>{" "}
                <kbd>H</kbd>. Mỗi lần nhấn là một lần đánh.
              </p>
            </div>
            <button className="text-button" onClick={() => setHelp(true)}>
              Xem hướng dẫn <ArrowUpRight size={15} />
            </button>
          </div>
        )}
        <footer>
          <span>
            <AudioLines size={14} />
            Chơi nhạc theo cách của bạn.
          </span>
          <span>Chạy trong trình duyệt · Lưu trên thiết bị</span>
        </footer>
      </main>
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="icon-button close-dialog"
              autoFocus
              aria-label="Đóng hướng dẫn"
              onClick={() => setHelp(false)}
            >
              <X size={20} />
            </button>
            <AudioLines size={32} />
            <h2 id="help-title">Bắt đầu chơi nhạc.</h2>
            <ol>
              <li>Chọn Guitar hoặc Piano, giọng và âm giai.</li>
              <li>
                Nhấn <strong>Bật âm thanh</strong> để chuẩn bị nhạc cụ.
              </li>
              <li>
                Nhấn <strong>A S D F G H J</strong> hoặc chạm vào hợp âm.
              </li>
              <li>
                Mỗi lần nhấn chỉ đánh một lần. Nhả rồi nhấn lại để đánh tiếp.
              </li>
              <li>
                Thử <strong>A → H → F → G</strong> để chơi C → Am → F → G ở
                giọng Đô trưởng.
              </li>
            </ol>
            <p>
              Bạn tự điều khiển nhịp và thời điểm chuyển hợp âm. Giữ phím không
              tự lặp. Âm đã đánh sẽ ngân tự nhiên sau khi nhả phím.
            </p>
            <p>
              <kbd>Space</kbd> dừng âm. <kbd>Esc</kbd> tắt mọi âm đang ngân. Chế
              độ bài hát chỉ hiển thị hợp âm để bạn tự chơi.
            </p>
            <button className="primary-button" onClick={() => setHelp(false)}>
              Bắt đầu chơi
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function AudioStatus() {
  const status = useStudio((x) => x.audioStatus);
  const t = useSyncExternalStore(
    audioEngine.subscribe,
    audioEngine.getSnapshot,
    audioEngine.getServerSnapshot,
  );
  return (
    <span className={`audio-status ${t.playing ? "playing" : ""}`}>
      <span className={`status-dot ${status === "ready" ? "live" : ""}`} />
      {t.playing
        ? "Đang ngân"
        : status === "ready"
          ? "Âm thanh sẵn sàng"
          : status === "loading"
            ? "Đang tải nhạc cụ"
            : status === "error"
              ? "Lỗi âm thanh"
              : "Âm thanh chưa bật"}
    </span>
  );
}
