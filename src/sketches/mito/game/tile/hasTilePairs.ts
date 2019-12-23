import { Vector2 } from "three";

export interface IHasTilePairs {
  tilePairs: Vector2[];
}

export function hasTilePairs(t: any): t is IHasTilePairs {
  return t.tilePairs instanceof Array;
}
