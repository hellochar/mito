import { Action, ActionMove } from "./action";
import { DIRECTIONS } from "./directions";

export const ACTION_KEYMAP: { [key: string]: Action } = {
  q: {
    type: "drop",
    sugar: 0,
    water: 0.25, // hack hack we can assume max 100 water, it's fine
  },
  e: {
    type: "drop",
    sugar: 0.25,
    water: 0, // hack hack we can assume max 100 water, it's fine
  },
};

export const MOVEMENT_KEYS: { [key: string]: ActionMove } = {
  w: {
    type: "move",
    dir: DIRECTIONS.n,
  },
  a: {
    type: "move",
    dir: DIRECTIONS.w,
  },
  s: {
    type: "move",
    dir: DIRECTIONS.s,
  },
  d: {
    type: "move",
    dir: DIRECTIONS.e,
  },
};

export const MOVEMENTS = Object.keys(MOVEMENT_KEYS).map((key) => MOVEMENT_KEYS[key]);
