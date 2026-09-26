import { describe, it, expect, vi } from "vitest";
import { PATTERNS } from "../../src/audio/rhythm/patterns";
import {
  adaptPattern,
  validatePattern,
  timeline,
  beatSeconds,
  quantizedStep,
} from "../../src/audio/rhythm/PatternEngine";
import { Scheduler } from "../../src/audio/core/Scheduler";
describe("Patterns and musical time", () => {
  it("validates every preset and allows mixed techniques", () => {
    expect(
      PATTERNS.filter((p) => p.instrument === "guitar").length,
    ).toBeGreaterThanOrEqual(11);
    expect(PATTERNS.filter((p) => p.instrument === "piano")).toHaveLength(7);
    PATTERNS.forEach((p) => expect(validatePattern(p)).toBeNull());
    const mixed = structuredClone(PATTERNS[0]);
    mixed.steps[0].actions = ["BASS", "PICK_3", "DOWN"];
    expect(validatePattern(mixed)).toBeNull();
  });
  it("converts BPM and subdivisions including compound meter", () => {
    expect(beatSeconds(120, "4/4")).toBe(0.5);
    expect(beatSeconds(120, "6/8")).toBe(0.25);
    expect(timeline(PATTERNS[0], 120)[7].time).toBe(1.75);
    const six = PATTERNS.find((p) => p.id === "g-68")!;
    expect(timeline(six, 120)[5].time).toBe(1.25);
  });
  it("resamples subdivisions without duplicating hits and adapts meter", () => {
    const p = adaptPattern(PATTERNS[0], "3/4", 4);
    expect(p.steps).toHaveLength(12);
    expect(p.steps[1].actions).toEqual(["REST"]);
    expect(validatePattern(p)).toBeNull();
  });
  it("rejects empty, malformed, and incompatible patterns", () => {
    expect(validatePattern({ ...PATTERNS[0], steps: [] })).toBeTruthy();
    const p = structuredClone(PATTERNS[0]);
    p.steps[0].actions = ["BLOCK"];
    expect(validatePattern(p)).toBeTruthy();
  });
  it("quantizes immediate, next beat and next bar changes", () => {
    expect(quantizedStep(3, 2, 8, "immediate")).toBe(3);
    expect(quantizedStep(3, 2, 8, "beat")).toBe(4);
    expect(quantizedStep(3, 2, 8, "bar")).toBe(8);
    expect(quantizedStep(8, 2, 8, "bar")).toBe(8);
    expect(quantizedStep(5, 1, 6, "bar")).toBe(6);
  });
  it("schedules using the audio clock and applies live tempo changes", () => {
    vi.useFakeTimers();
    let now = 0;
    let interval = 0.5;
    const schedule = vi.fn();
    const clock = new Scheduler(
      () => now,
      () => interval,
      schedule,
    );
    clock.start();
    expect(schedule).toHaveBeenNthCalledWith(1, 0, 0.012);
    now = 0.48;
    clock.tick();
    expect(schedule.mock.calls[1][0]).toBe(1);
    interval = 0.25;
    now = 0.98;
    clock.tick();
    expect(clock.nextTime).toBeCloseTo(1.262);
    clock.stop();
    vi.useRealTimers();
  });
  it("recovers from a stalled main thread without replaying a burst", () => {
    vi.useFakeTimers();
    let now = 0;
    const fn = vi.fn();
    const clock = new Scheduler(
      () => now,
      () => 0.25,
      fn,
    );
    clock.start();
    now = 10;
    clock.tick();
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls[1][1]).toBeCloseTo(10.012);
    clock.stop();
    vi.useRealTimers();
  });
});
