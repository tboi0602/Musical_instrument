import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Chordroom · Một phím. Một lần đánh.",
  description:
    "Phòng nhạc guitar và piano tương tác. Mỗi lần nhấn đánh một hợp âm, bạn tự chơi theo nhịp của mình.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
