"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-page">
      <h1>Phòng nhạc gặp lỗi.</h1>
      <p>Có lỗi làm gián đoạn giao diện. Hãy mở lại phòng nhạc để tiếp tục.</p>
      <button className="primary-button" onClick={reset}>
        Thử lại
      </button>
    </main>
  );
}
