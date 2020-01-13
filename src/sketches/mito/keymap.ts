import { Action, ActionMove } from "./action";
import { DIRECTIONS } from "./directions";

export const ACTION_CONTINUOUS_KEYMAP: { [key: string]: Action } = {
  Space: {
    type: "pickup",
    sugar: 30,
    water: 30,
  },
};

export const ACTION_INSTANT_KEYMAP: { [key: string]: Action } = {
  KeyQ: {
    type: "drop",
    sugar: 0,
    water: 5,
  },
  KeyE: {
    type: "drop",
    sugar: 1,
    water: 0,
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
