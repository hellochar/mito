import { Action, ActionMove } from "./action";
import { DIRECTIONS } from "./directions";

export const ACTION_KEYMAP: { [key: string]: Action } = {
  KeyQ: {
    type: "drop",
    sugar: 0,
    water: 1, // hack hack we can assume max 100 water, it's fine
  },
  keyE: {
    type: "drop",
    sugar: 1,
    water: 0, // hack hack we can assume max 100 water, it's fine
  },
  Space: {
    type: "pickup",
    sugar: 1,
    water: 1,
  },
};

export const MOVEMENT_KEYS: { [key: string]: ActionMove } = {
  KeyW: {
    type: "move",
    dir: DIRECTIONS.n,
  },
  KeyA: {
    type: "move",
    dir: DIRECTIONS.w,
  },
  KeyS: {
    type: "move",
    dir: DIRECTIONS.s,
  },
  KeyD: {
    type: "move",
    dir: DIRECTIONS.e,
  },
};

export const MOVEMENTS = Object.keys(MOVEMENT_KEYS).map((key) => MOVEMENT_KEYS[key]);
