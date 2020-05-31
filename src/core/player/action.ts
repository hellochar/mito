import { CancerEffect } from "core/cell";
import { FreezeEffect, Tile } from "core/tile";
import { Vector2 } from "three";
import { CellArgs } from "../cell/cell";
import { CellType } from "../cell/genome";

export interface ActionBase {
  continuous?: boolean;
}

export interface ActionMove extends ActionBase {
  type: "move";
  dir: Vector2;
}

export interface ActionBuild extends ActionBase {
  type: "build";
  cellType: CellType;
  args?: CellArgs;
  position: Vector2;
}

export interface ActionDeconstruct extends ActionBase {
  type: "deconstruct";
  position: Vector2;
  force?: boolean;
}

/**
 * Instantaneously drop some amount of water and sugar.
 */
export interface ActionDrop extends ActionBase {
  type: "drop";
  water: number;
  sugar: number;
  target: Tile;
  continuous?: boolean;
}

export interface ActionPickup extends ActionBase {
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

export interface ActionMultiple extends ActionBase {
  type: "multiple";
  actions: Action[];
}

export interface ActionLong<T extends Action = Action> extends ActionBase {
  type: "long";
  elapsed: number;
  duration: number;
  effect: T;
}

export interface ActionThaw extends ActionBase {
  type: "thaw";
  target: FreezeEffect;
}

export interface ActionRemoveCancer extends ActionBase {
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
