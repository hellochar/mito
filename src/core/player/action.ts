import { Vector2 } from "three";
import { CellArgs } from "../../sketches/mito/game/tile/cell";
import { CellType } from "../../sketches/mito/game/tile/genome";
import { Interactable } from "../interactable";

export interface ActionMove {
  type: "move";
  dir: Vector2;
}

export interface ActionBuild {
  type: "build";
  cellType: CellType;
  args?: CellArgs;
  position: Vector2;
}

export interface ActionDeconstruct {
  type: "deconstruct";
  position: Vector2;
  force?: boolean;
}

/**
 * Instantaneously drop some amount of water and sugar.
 */
export interface ActionDrop {
  type: "drop";
  water: number;
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
  | ActionMove
  | ActionBuild
  | ActionDeconstruct
  | ActionDrop
  | ActionLong<any>
  | ActionMultiple
  | ActionPickup
  | ActionInteract;
