import { CommittablePoints, CommittablePointsParameters } from "./committablePoints";

interface PointState<S> {
  r?: number;
  time: number;
  size: number;
  x: number;
  y: number;
  z: number;
  info: S;
}

export class FireAndForgetPoints<S = any> extends CommittablePoints {
  private state: Set<PointState<S>> = new Set();
  constructor(public lifeFn: (s: PointState<S>) => undefined | false, params: CommittablePointsParameters) {
    super(10000, params);
  }

  fire(x: number, y: number, z: number, size: number, info: S) {
    this.state.add({
      size,
      x,
      y,
      z,
      time: 0,
      info,
    });
  }

  update(dt: number) {
    const toRemove: PointState<S>[] = [];
    for (const p of this.state) {
      p.time += dt;
      const nextState = this.lifeFn(p);
      if (nextState === false) {
        toRemove.push(p);
      }
    }
    for (const p of toRemove) {
      this.state.delete(p);
    }
  }

  commitAll() {
    this.startFrame();
    for (const p of this.state) {
      this.commit(p.x, p.y, p.z, p.size, p.r);
    }
    this.endFrame();
  }
}
