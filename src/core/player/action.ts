import { CancerEffect } from "core/cell";
import { FreezeEffect, Tile } from "core/tile";
import { Vector2 } from "three";
import { CellArgs } from "../cell/cell";
import { CellType } from "../cell/genome";

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
  target: Tile;
  continuous?: boolean;
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

  target: Tile;
  continuous?: boolean;
}

export interface ActionMultiple {
  type: "multiple";
  actions: Action[];
}

export interface ActionLong<T extends Action = Action> {
  type: "long";
  elapsed: number;
  duration: number;
  effect: T;
}

export interface ActionThaw {
  type: "thaw";
  target: FreezeEffect;
}

export interface ActionRemoveCancer {
  type: "remove-cancer";
  target: CancerEffect;
}

export type Action =
  | ActionMove
  | ActionBuild
  | ActionDeconstruct
  | ActionDrop
  | ActionLong<any>
  | ActionMultiple
  | ActionPickup
  | ActionThaw
  | ActionRemoveCancer;

/**
 * A continuous action should be re-set every frame while holding the mouse button.
 */
export function isContinuous(action: Action) {
  if (action.type === "pickup" || action.type === "drop") {
    return !!action.continuous;
  } else if (action.type === "remove-cancer" || action.type === "thaw") {
    return true;
  }
  return false;
}
