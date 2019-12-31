import { Vector2 } from "three";
import { Constructor } from "./constructor";
import { Interactable } from "./game/interactable";
import { Cell } from "./game/tile";

export interface ActionStill {
  type: "still";
}

export interface ActionMove {
  type: "move";
  dir: Vector2;
}

export interface ActionBuild<T extends Cell = any> {
  type: "build";
  cellType: Constructor<T>;
  args?: any[];
  position: Vector2;
}

export interface ActionDeconstruct {
  type: "deconstruct";
  position: Vector2;
  force?: boolean;
}

export interface ActionDrop {
  type: "drop";

  /**
   * Rate of water drop per second.
   */
  water: number;

  /**
   * Rate of sugar drop per second.
   */
  sugar: number;
}

export interface ActionPickup {
  type: "pickup";

  /**
   * Rate of sugar pickup per second.
   */
  water: number;

  /**
   * Rate of sugar pickup per second.
   */
  sugar: number;
}

export interface ActionNone {
  type: "none";
}

export interface ActionMultiple {
  type: "multiple";
  actions: Action[];
}

export interface ActionInteract {
  type: "interact";
  interactable: Interactable;
}

export interface ActionLong<T extends Action = Action> {
  type: "long";
  elapsed: number;
  duration: number;
  effect: T;
}

export type Action =
  | ActionStill
  | ActionMove
  | ActionBuild
  | ActionDeconstruct
  | ActionDrop
  | ActionLong<any>
  | ActionNone
  | ActionMultiple
  | ActionPickup
  | ActionInteract;
