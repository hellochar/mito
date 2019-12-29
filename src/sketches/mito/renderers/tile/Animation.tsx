import Ticker from "global/ticker";

export type Animation = (dt: number) => boolean;
export class AnimationController {
  animation?: Animation;
  timeStarted?: number;
  set(a: Animation) {
    this.animation = a;
    this.timeStarted = Ticker.now / 1000;
  }
  update(now: number) {
    if (this.animation != null && this.timeStarted != null) {
      const dt = now - this.timeStarted;
      const ended = this.animation(dt);
      if (ended) {
        this.animation = undefined;
        this.timeStarted = undefined;
      }
    }
  }
}
