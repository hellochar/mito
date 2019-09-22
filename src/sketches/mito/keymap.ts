import { Action, ActionMove } from "./action";
import { Constructor } from "./constructor";
import { DIRECTIONS } from "./directions";
import { Cell, Fruit, Leaf, Root, Tissue, Transport } from "./game/tile";

export const ACTION_KEYMAP: { [key: string]: Action } = {
  "q": {
    type: "drop",
    sugar: 0,
    water: 0.25, // hack hack we can assume max 100 water, it's fine
  },
  "e": {
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

export const BUILD_HOTKEYS: { [key: string]: Constructor<Cell> } = {
  1: Tissue,
  2: Leaf,
  3: Root,
  4: Transport,
  5: Fruit,

  // t: Tissue,
  // f: Leaf,
  // r: Root,
  // T: Transport,
  // F: Fruit,

  // v: Vein,
};
