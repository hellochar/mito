import Ticker from "global/ticker";

export type Animation = (t: number, dt: number) => boolean;

export class AnimationController {
  public animation?: Animation;

  timeStarted?: number;

  timeLastUpdated?: number;

  set(a: Animation) {
    this.animation = a;
    this.timeLastUpdated = this.timeStarted = Ticker.now / 1000;
  }

  update() {
    if (this.animation != null && this.timeStarted != null && this.timeLastUpdated != null) {
      const now = Ticker.now / 1000;
      const t = now - this.timeStarted;
      const dt = now - this.timeLastUpdated;
      const ended = this.animation(t, dt);
      this.timeLastUpdated = now;
      if (ended) {
        this.animation = undefined;
        this.timeStarted = undefined;
        this.timeLastUpdated = undefined;
      }
    }
  }
}

export function chain(...animations: Animation[]): Animation {
  let index = 0;
  let lastStarted = 0;
  return (t, dt) => {
    const currAnimation = animations[index];
    const ended = currAnimation(t - lastStarted, dt);
    if (ended) {
      index++;
      lastStarted = t;
    }
    return index >= animations.length;
  };
}

export function also(firstAnim: Animation, secondAnim: Animation): Animation {
  let secondEnded = false;
  return (t, dt) => {
    const firstEnded = firstAnim(t, dt);
    if (!secondEnded) {
      secondEnded = secondAnim(t, dt);
    }

    return firstEnded;
  };
}

export function animPause(time: number): Animation {
  return (t) => {
    return t > time;
  };
}
