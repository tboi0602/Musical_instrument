/** Polling only fills the audio queue; audible timing is owned by AudioContext. */
export class Scheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  nextTime = 0;
  nextStep = 0;
  constructor(
    private now: () => number,
    private interval: () => number,
    private schedule: (step: number, time: number) => void,
    private horizon = 0.06,
  ) {}
  start() {
    this.stop();
    this.nextStep = 0;
    this.nextTime = this.now() + 0.012;
    this.tick();
    this.timer = setInterval(() => this.tick(), 20);
  }
  tick() {
    const now = this.now();
    if (this.nextTime < now - 0.1) this.nextTime = now + 0.012;
    let count = 0;
    while (this.nextTime < now + this.horizon && count++ < 64) {
      this.schedule(this.nextStep, this.nextTime);
      this.nextStep++;
      this.nextTime += this.interval();
    }
  }
  stop() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }
}
