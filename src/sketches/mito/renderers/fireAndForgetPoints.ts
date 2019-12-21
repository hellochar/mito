import { CommittablePoints, CommittablePointsParameters } from "./committablePoints";

interface PointState {
  time: number;
  size: number;
  x: number;
  y: number;
  z: number;
}

export class FireAndForgetPoints extends CommittablePoints {
  private state: Set<PointState> = new Set();
  constructor(public lifeFn: (s: PointState) => PointState | false, params: CommittablePointsParameters) {
    super(10000, params);
  }

  fire(x: number, y: number, z: number, size: number) {
    this.state.add({
      size,
      x,
      y,
      z,
      time: 0,
    });
  }

  update(dt: number) {
    const toRemove: PointState[] = [];
    for (const p of this.state) {
      p.time += dt;
      const nextState = this.lifeFn(p);
      if (nextState === false) {
        toRemove.push(p);
      } else {
        Object.assign(p, nextState);
      }
    }
    for (const p of toRemove) {
      this.state.delete(p);
    }
  }

  commitAll() {
    this.startFrame();
    for (const p of this.state) {
      this.commit(p.x, p.y, p.z, p.size);
    }
    this.endFrame();
  }
}
