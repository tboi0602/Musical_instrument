import { test, expect, type Page } from "@playwright/test";

async function instrumentAudio(page: Page) {
  await page.addInitScript(`
    window.__attacks = 0;
    const originalStart = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args) { window.__attacks++; return originalStart.apply(this, args); };
    window.__meters = [];
    const originalConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(destination, ...args) {
      if (destination instanceof AudioDestinationNode) {
        const analyser = this.context.createAnalyser(); analyser.fftSize = 2048;
        window.__meters.push(analyser); originalConnect.call(this, analyser); originalConnect.call(analyser, destination); return destination;
      }
      return originalConnect.call(this, destination, ...args);
    };
    window.__peak = () => Math.max(0, ...window.__meters.map(a => { const data = new Float32Array(a.fftSize); a.getFloatTimeDomainData(data); return Math.max(...data.map(Math.abs)); }));
  `);
}
const attacks = (page: Page) => page.evaluate<number>("window.__attacks");
async function enable(page: Page) {
  await page.getByRole("button", { name: "Bật âm thanh", exact: true }).click();
  await expect(
    page.getByText("Âm thanh sẵn sàng", { exact: true }),
  ).toBeVisible();
}

test("mỗi lần nhấn guitar chỉ đánh một lần, giữ phím không lặp", async ({
  page,
}) => {
  await instrumentAudio(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(
    page.getByRole("button", { name: "Bật âm thanh", exact: true }),
  ).toBeEnabled();
  await page.keyboard.press("a");
  await expect(page.getByRole("status")).toContainText("Bật âm thanh");
  await enable(page);
  expect(await attacks(page)).toBe(0);
  await page.keyboard.down("a");
  await expect.poll(() => attacks(page)).toBe(5);
  await expect
    .poll(() => page.evaluate<number>("window.__peak()"))
    .toBeGreaterThan(0.001);
  await page.keyboard.down("a"); // Repeat keydown must not create another attack.
  await expect(
    page.getByText("Âm thanh sẵn sàng", { exact: true }),
  ).toBeVisible({ timeout: 6000 });
  expect(await attacks(page)).toBe(5);
  await expect
    .poll(() => page.evaluate<number>("window.__peak()"))
    .toBeLessThan(0.0001);
  await page.keyboard.up("a");
  await page.keyboard.press("a");
  expect(await attacks(page)).toBe(10);
  await page.keyboard.press("h");
  expect(await attacks(page)).toBe(15);
  await expect(page.getByTestId("current-chord")).toHaveText("Am");
  await page.getByRole("button", { name: "Tắt khẩn cấp", exact: true }).click();
  await page.getByRole("button", { name: "Quạt lên", exact: true }).click();
  await page.getByLabel("GIỌNG", { exact: true }).selectOption("G");
  await page.getByRole("spinbutton", { name: "BPM", exact: true }).fill("140");
  expect(await attacks(page)).toBe(15); // Settings must never retrigger a chord.
  await page
    .getByRole("button", { name: "Đánh G, phím A", exact: true })
    .click();
  expect(await attacks(page)).toBe(21);
  await page.getByRole("button", { name: "Tắt khẩn cấp", exact: true }).click();
  await page.screenshot({
    path: "test-results/tieng-viet-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("piano, thiết lập cũ và máy đếm nhịp không làm lặp hợp âm", async ({
  page,
}) => {
  await instrumentAudio(page);
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "chordroom-v1",
      JSON.stringify({
        settings: {
          instrument: "piano",
          playMode: "hold",
          quantization: "bar",
          metronome: true,
        },
        onboarded: true,
      }),
    ),
  );
  await page.reload();
  await enable(page);
  await expect(
    page.getByRole("switch", { name: "Máy đếm nhịp" }),
  ).toHaveAttribute("aria-checked", "false");
  await page.keyboard.press("a");
  expect(await attacks(page)).toBe(3);
  await expect
    .poll(() => page.evaluate<number>("window.__peak()"))
    .toBeGreaterThan(0.001); // Keyup leaves the natural tail intact.
  await expect(
    page.getByText("Âm thanh sẵn sàng", { exact: true }),
  ).toBeVisible({ timeout: 6000 });
  expect(await attacks(page)).toBe(3);
  await page.getByRole("switch", { name: "Máy đếm nhịp" }).click();
  await page.keyboard.press("a");
  expect(await attacks(page)).toBe(6);
  await expect(
    page.getByText("Âm thanh sẵn sàng", { exact: true }),
  ).toBeVisible({ timeout: 6000 });
  expect(await attacks(page)).toBe(6);
  await page.getByRole("button", { name: "Tắt khẩn cấp", exact: true }).click();
  await expect
    .poll(() => page.evaluate<number>("window.__peak()"))
    .toBeLessThan(0.0001);
  await expect(
    page.getByRole("switch", { name: "Máy đếm nhịp" }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "Nốt gốc", exact: true }).click();
  await page.keyboard.press("a");
  expect(await attacks(page)).toBe(7);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Nốt gốc", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("bài hát tiếng Việt, không tự chuyển hợp âm và không bắt phím khi nhập", async ({
  page,
}) => {
  await instrumentAudio(page);
  await page.goto("/");
  await enable(page);
  await page.getByRole("button", { name: "Bài hát", exact: true }).click();
  await page.getByRole("button", { name: "Sửa bài hát", exact: true }).click();
  await page.getByLabel("Hợp âm đoạn 1").fill("I | abc");
  await page.getByRole("button", { name: "Lưu bài hát", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Hợp âm không hợp lệ" }),
  ).toBeVisible();
  expect(await attacks(page)).toBe(0);
  await page.getByLabel("Hợp âm đoạn 1").fill("I | vi:2 | IV | V");
  await page.getByRole("button", { name: "Lưu bài hát", exact: true }).click();
  await page.locator(".song-card").nth(1).click();
  expect(await attacks(page)).toBe(5);
  await expect(page.getByTestId("current-chord")).toHaveText("Am");
  await page.getByRole("button", { name: "Tiếp", exact: true }).click();
  expect(await attacks(page)).toBe(5);
  await expect(
    page.getByText("Âm thanh sẵn sàng", { exact: true }),
  ).toBeVisible({ timeout: 6000 });
  expect(await attacks(page)).toBe(5);
  await page
    .getByRole("button", { name: "Hướng dẫn chơi", exact: true })
    .click();
  await page.keyboard.press("a");
  expect(await attacks(page)).toBe(5);
  await page.keyboard.press("Escape");
});

test("chạm hợp âm trên điện thoại phát đúng một lượt và giao diện không tràn", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await instrumentAudio(page);
  await page.goto("/");
  await enable(page);
  await page
    .getByRole("button", { name: "Đánh C, phím A", exact: true })
    .click();
  expect(await attacks(page)).toBe(5);
  await expect(
    page.getByText("Âm thanh sẵn sàng", { exact: true }),
  ).toBeVisible({ timeout: 6000 });
  expect(await attacks(page)).toBe(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/tieng-viet-mobile.png",
    fullPage: true,
  });
});
