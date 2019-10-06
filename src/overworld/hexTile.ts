import { LevelInfo } from "./levelInfo";

const C = Math.sqrt(3) / 2;

export class HexTile {
  /**
   * store neighbors at angles [30, 90, 150, 210, 270, 330]
   *
   * 30: (1, 0, -1)
   *
   * 90: (0, 1, -1)
   *
   * 150: (-1, 1, 0)
   *
   * 210: (-1, 0, 1)
   *
   * 270: (0, -1, 1)
   *
   * 330: (1, -1, 0)
   */
  neighbors: HexTile[] = new Array(6);
  info: LevelInfo = {
    height: 0,
    rainfall: "medium",
    soilType: "average",
    temperature: "temperate",
    wind: "low",
    visible: false,
  };
  get k() {
    return -(this.i + this.j);
  }
  get magnitude() {
    return Math.abs(this.i) + Math.abs(this.j) + Math.abs(this.k);
  }
  get cartesian() {
    const { i, j } = this;
    // simplified version:
    // x = i - 0.5j - 0.5*-(i + j)
    // x = i - 0.5j + 0.5i + 0.5j
    // x = 1.5i
    // y = Cj - C*-(i + j)
    // y = Cj + Ci + Cj
    // y = 2Cj + Ci
    return {
      x: 1.5 * i,
      y: 2 * C * j + C * i,
    };
  }
  constructor(public i: number, public j: number) { }
}
