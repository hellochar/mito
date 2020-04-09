import { randomName } from "common/randomName";
import { identifier, object, serializable } from "serializr";
import uuid from "uuid";
import { LevelInfo, LevelInfoSchema } from "./levelInfo";

const C = Math.sqrt(3) / 2;

export class HexTile {
  @serializable
  private version = 1;

  @serializable(identifier())
  private uuid = uuid();

  @serializable
  private _displayName?: string;

  public get displayName() {
    // existing saves that don't have a displayName
    // will get one
    if (this._displayName == null) {
      if (this.info.height < 0) {
        this._displayName = "Deep Water";
      } else {
        this._displayName = randomName();
      }
    }
    return this._displayName;
  }

  @serializable(object(LevelInfoSchema))
  info: LevelInfo = {
    seed: Math.random() * Number.MAX_SAFE_INTEGER,
    height: -1,
    rainfall: "medium",
    soilType: "average",
    temperature: "temperate",
    // wind: "low",
    visible: false,
  };

  @serializable
  public i: number;

  @serializable
  public j: number;

  // Handle 0 arg constructor from serializr
  constructor(i?: number, j?: number) {
    this.i = i!;
    this.j = j!;
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

  get isHabitable() {
    return this.info.height !== -1;
  }

  get k() {
    return -(this.i + this.j);
  }

  get magnitude() {
    return Math.abs(this.i) + Math.abs(this.j) + Math.abs(this.k);
  }
}
