import { Action, ActionMove } from "./action";
import { DIRECTIONS } from "./directions";

export const ACTION_KEYMAP: { [key: string]: Action } = {
  KeyQ: {
    type: "drop",
    sugar: 0,
    water: 30,
  },
  KeyE: {
    type: "drop",
    sugar: 30,
    water: 0,
  },
  Space: {
    type: "pickup",
    sugar: 30,
    water: 30,
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

export const CELL_BAR_KEYS: Record<string, number> = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Digit5: 4,
};

export const MOVEMENTS = Object.keys(MOVEMENT_KEYS).map((key) => MOVEMENT_KEYS[key]);
