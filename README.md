# Chordroom — Một phím, một lần đánh

Ô **Lời bài hát** hiển thị trực tiếp bên dưới bàn phím hợp âm ở màn hình chính và trong chế độ Bài hát. Nhập hoặc dán lời vào từng đoạn; nội dung tự lưu trên thiết bị, không cần mở trình sửa hay bấm nút lưu.

Trong **Bài hát → Sửa bài hát**, mỗi đoạn có ô **Lời bài hát**. Lời được lưu cùng hợp âm, giữ nguyên xuống dòng và hiển thị bên dưới để vừa nhìn vừa chơi. Toàn bộ hợp âm của bài hiện thành lưới 3 cột trên máy tính, 2 cột trên điện thoại. Các hợp âm quen thuộc giữ phím A/S/D/F/G/H/J; hợp âm khác được gán K/L/Q… và hiển thị phím ngay trên thẻ. Hợp âm trùng nhau dùng chung phím.

Hỗ trợ hợp âm có nốt trầm riêng (slash chord): nhập `E/D`, `C/G`, `F#m/C#` hoặc `E/D:2` trong phần sửa bài hát. `E/D` phát hợp âm Mi trưởng với Rê ở bè trầm. Khi chuyển tông, cả hợp âm và nốt trầm đều được chuyển theo.

Phòng nhạc guitar và piano bằng tiếng Việt. **Mỗi lần nhấn phím chỉ đánh một hợp âm một lần.** Người chơi tự quyết định nhịp, khoảng nghỉ và thời điểm chuyển hợp âm.

## Chạy ứng dụng

Cần Node.js 20.9 trở lên.

```sh
npm install
npm run dev
```

Mở http://localhost:3000 và nhấn **Bật âm thanh**. Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd install` và `npm.cmd run dev`.

## Cách chơi

- Nhấn **A** một lần: guitar quạt hợp âm C một lượt; piano đánh C một lần.
- Nhấn **A A H H**: đánh C hai lần, rồi Am hai lần trong giọng Đô trưởng.
- Giữ phím không tự lặp. Nhả rồi nhấn lại để đánh tiếp.
- Nhả phím không cắt âm: tiếng đàn đã phát vẫn ngân tự nhiên.
- Mỗi lần chạm hợp âm trên màn hình cũng chỉ phát một lượt.
- `Space` dừng âm; `Esc` tắt khẩn cấp. Không bắt phím khi đang nhập liệu.

| Phím | Đô trưởng | Sol trưởng | La thứ tự nhiên |
| ---- | --------- | ---------- | --------------- |
| A    | C         | G          | Am              |
| S    | Dm        | Am         | Bdim            |
| D    | Em        | Bm         | C               |
| F    | F         | C          | Dm              |
| G    | G         | D          | Em              |
| H    | Am        | Em         | F               |
| J    | Bdim      | F#dim      | G               |

## Chọn cách đánh

Guitar mặc định **Quạt xuống**; các dây được phát lần lượt cách nhau 10–25 ms, không đồng thời như piano. Có thể chọn quạt lên, chặn dây, gảy nốt trầm, gảy riêng từng dây hoặc vỗ dây. Dây bị tắt trong thế hợp âm không phát tiếng khi gảy.

Piano mặc định **Đánh cả hợp âm**; có thể chọn hợp âm kèm quãng tám, nốt gốc, bậc ba, bậc năm hoặc nốt gốc cao. Có thế gốc, đảo một, đảo hai và tự chọn thế chuyển âm gần.

Các lựa chọn chỉ đổi kỹ thuật cho lần nhấn tiếp theo. Đổi nhạc cụ, giọng, âm giai, tốc độ hoặc âm lượng **không tự phát thêm hợp âm**.

## Nhịp và bài hát

Máy đếm nhịp chỉ chạy khi bật công tắc, hoàn toàn độc lập với hợp âm. Tiếng nhịp không kích hoạt tiếng đàn. BPM tính theo nốt đen; mỗi phách hiển thị của 6/8 là một nốt móc đơn. Dừng hoặc tắt khẩn cấp cũng tắt máy đếm nhịp.

Chế độ **Bài hát** cho phép nhập các đoạn và vòng hợp âm, ví dụ `C | Am:2 | F | G` hoặc `I | vi:2 | IV | V`. Hậu tố `:2` ghi chú hai ô nhịp. Đổi giọng chính để chuyển tông. Hợp âm mở rộng như Cmaj7, C7, Csus4, Cadd9 được hỗ trợ trên các thẻ bài hát.

Nhấn thẻ bài hát đánh một lần. Nút **Trước/Tiếp** chỉ di chuyển vị trí hướng dẫn, không phát nhạc. Bài hát không tự chạy hay tự chuyển hợp âm theo thời gian.

## Lưu thiết lập

Giọng, nhạc cụ, cách đánh, BPM, âm lượng và bài hát được lưu trong localStorage trên thiết bị. Không có máy chủ hoặc tài khoản.

Dữ liệu phiên bản trước vẫn được đọc. Các thiết lập Trigger/Hold, chờ beat/bar và mẫu đệm cũ không thể kích hoạt đệm tự động nữa. Máy đếm nhịp luôn tắt khi mở lại trang. Các mẫu đã lưu được giữ trong dữ liệu tương thích nhưng không xuất hiện trong luồng chơi thủ công.

## Kiến trúc

```text
src/app/                   Trang Next.js, giao diện và trạng thái lỗi
src/components/            Điều khiển, hợp âm, cách đánh, bài hát, mixer
src/musicTheory/           Nốt, âm giai, công thức hợp âm, chuyển tông
src/audio/core/            AudioEngine, nguồn âm, đồng hồ máy đếm nhịp
src/audio/instruments/     Guitar và piano: thực thi kỹ thuật từng lần đánh
src/audio/manual.ts        Kỹ thuật cho mỗi lần nhấn và tên tiếng Việt
src/audio/rhythm/          Tiện ích nhịp và dữ liệu mẫu tương thích
src/store/                 Zustand và lưu trữ thiết lập
src/types/                 Kiểu dữ liệu âm nhạc
tests/unit/                Kiểm tra nhạc lý, voicing, kỹ thuật, nhịp
tests/e2e/                 Kiểm tra trình duyệt và tín hiệu âm thanh
```

Luồng phát: phím → bậc âm giai → hợp âm → **một kỹ thuật** → các nốt của lần đánh → âm ngân tự tắt. `AudioEngine.trigger()` không chạy sequencer, không đặt lịch đánh tiếp và không chờ beat/bar. Scheduler chỉ phục vụ máy đếm nhịp. Cập nhật hình ảnh dựa trên đồng hồ audio, không quyết định thời điểm phát âm.

Nguồn âm là PCM được tạo và lưu đệm: guitar dùng mô hình dây gảy với đường trễ suy giảm; piano dùng họa âm bất điều hòa có độ tắt riêng cùng tiếng búa. Oscillator đơn giản chỉ dùng cho tiếng máy đếm nhịp. Có gain riêng, compressor, giới hạn voice và dọn AudioNode.

Muốn thêm nhạc cụ, triển khai hợp đồng `Instrument`, đăng ký trong `AudioEngine`, bổ sung kỹ thuật trong `audio/manual.ts` và bộ chọn nhạc cụ. Có thể thay `ModeledSource` bằng nguồn multisample mà không đổi music theory hoặc bàn phím.

## Kiểm tra và build

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm start
```

Playwright mặc định dùng Chrome đã cài trên Windows. Với hệ điều hành khác, đặt `CHROME_PATH` hoặc chạy `npx playwright install chromium`. Kiểm thử đếm lần khởi động nguồn audio để bảo đảm một lần nhấn không lặp, đo tín hiệu sau khi nhả phím, kiểm tra thiết lập cũ, máy đếm nhịp độc lập, bài hát và màn hình rộng 390 px.

## Giới hạn

- Âm thanh được mô phỏng, chưa dùng sample thu từ nhạc cụ acoustic thật.
- Nốt nhạc hiển thị bằng ký hiệu quốc tế C, Dm, F#; đầu vào có dấu giáng được chuẩn hóa thành dấu thăng.
- Tự động kiểm tra trên Chromium; Safari/iOS/Android cần thử thêm trên thiết bị thật.
- Dừng khi chuyển tab hoặc cửa sổ mất tiêu điểm để tránh âm bị treo.
- Chưa có MIDI, thu âm, xuất âm thanh hoặc đồng bộ dữ liệu nhiều thiết bị.
