import { EventEmitter } from "events";
import { Vector2 } from "three";
import { traitMod } from "../../../evolution/traits";
import {
  Action,
  ActionBuild,
  ActionDeconstruct,
  ActionDrop,
  ActionInteract,
  ActionLong,
  ActionMove,
  ActionMultiple,
  ActionPickup,
} from "../action";
import { build, footsteps } from "../audio";
import { Constructor } from "../constructor";
import { hasInventory, Inventory } from "../inventory";
import {
  CELL_MAX_ENERGY,
  PLAYER_BASE_SPEED,
  PLAYER_MAX_RESOURCES,
  PLAYER_MOVED_BY_TRANSPORT_SPEED,
  PLAYER_STARTING_SUGAR,
  PLAYER_STARTING_WATER,
} from "./constants";
import { Steppable } from "./entity";
import { Cell, FreezeEffect, Fruit, GrowingCell, Tile, Transport } from "./tile";
import { World } from "./world";

export class Player implements Steppable {
  public inventory = new Inventory(PLAYER_MAX_RESOURCES, this, PLAYER_STARTING_WATER, PLAYER_STARTING_SUGAR);
  private action?: Action;
  private events = new EventEmitter();
  public baseSpeed: number;
  public dtSinceLastStepped = 0;

  public get speed() {
    const t = this.currentTile();
    return this.baseSpeed * (t instanceof Cell ? t.tempo : 1);
  }

  get pos() {
    return this.posFloat.clone().round();
  }

  public constructor(public posFloat: Vector2, public world: World) {
    this.baseSpeed = traitMod(world.traits.walkSpeed, PLAYER_BASE_SPEED, 1.5);
  }

  shouldStep() {
    return true;
  }

  public setAction(action: Action) {
    if (this.action != null) {
      if (this.action.type === "long") {
        // don't allow anything to happen during long actions.
        return;
      } else {
        this.action = {
          type: "multiple",
          actions: [this.action, action],
        };
      }
    } else {
      if (action.type === "build" && action.cellType === Fruit) {
        this.action = {
          type: "long",
          duration: 6.0,
          effect: action,
          elapsed: 0,
        };
      } else {
        this.action = action;
      }
    }
  }

  public getAction() {
    return this.action;
  }

  public droopY() {
    const tile = this.world.tileAt(this.pos.x, this.pos.y);
    if (tile instanceof Cell) {
      return tile.droopY;
    } else {
      return 0;
    }
  }

  public droopPosFloat() {
    const droopY = this.droopY();
    if (droopY !== 0) {
      const t = this.posFloat.clone();
      t.y += droopY;
      return t;
    }
    return this.posFloat;
  }

  public currentTile() {
    return this.world.tileAt(this.pos)!;
  }

  getBuildError(): "water" | "sugar" | "water and sugar" | undefined {
    const waterCost = 1;
    const sugarCost = 1;
    const needWater = this.inventory.water < waterCost;
    const needSugar = this.inventory.sugar < sugarCost;

    if (needWater && needSugar) {
      return "water and sugar";
    } else if (needWater && !needSugar) {
      return "water";
    } else if (needSugar && !needWater) {
      return "sugar";
    } else {
      return;
    }
  }

  public on(event: "action", cb: (action: Action) => void): void;
  public on(event: "start-long-action", cb: (action: ActionLong) => void): void;
  public on(event: string, cb: (...args: any[]) => void) {
    this.events.on(event, cb);
  }

  public step(dt: number) {
    if (this.action === undefined) {
      this.action = { type: "none" };
    }
    const actionSuccessful = this.attemptAction(this.action, dt);
    this.maybeMoveWithTransports(dt);
    if (actionSuccessful) {
      this.events.emit("action", this.action);
    }
    if (this.action.type === "long") {
      if (actionSuccessful) {
        this.action = undefined;
      }
    } else {
      this.action = undefined;
    }
  }

  private maybeMoveWithTransports(dt: number) {
    const tile = this.currentTile();
    if (tile instanceof Transport) {
      this.posFloat.add(tile.dir.clone().setLength(PLAYER_MOVED_BY_TRANSPORT_SPEED * dt));
    }
  }

  public attemptAction(action: Action, dt: number): boolean {
    switch (action.type) {
      case "none":
        // literally do nothing
        return true;
      case "still":
        return this.attemptStill(dt);
      case "move":
        return this.attemptMove(action, dt);
      case "build":
        return this.attemptBuild(action, dt);
      case "deconstruct":
        return this.attemptDeconstruct(action, dt);
      case "drop":
        return this.attemptDrop(action, dt);
      case "pickup":
        return this.attemptPickup(action, dt);
      case "multiple":
        return this.attemptMultiple(action, dt);
      case "interact":
        return this.attemptInteract(action, dt);
      case "long":
        return this.attemptLong(action, dt);
    }
  }

  public verifyMove(action: ActionMove, dt: number) {
    const target = this.posFloat
      .clone()
      .add(action.dir.clone().setLength(this.speed * dt))
      .round();
    return this.isWalkable(target);
  }

  public isWalkable(pos: Tile | Vector2) {
    if (pos instanceof Tile) {
      pos = pos.pos;
    }
    if (!this.world.isValidPosition(pos.x, pos.y)) {
      return false;
    }
    const tile = this.world.tileAt(pos.x, pos.y);
    if (!(tile instanceof Cell) || tile == null || tile.isObstacle) {
      // can't move!
      return false;
    }
    if (tile instanceof Cell) {
      return tile.findEffectOfType(FreezeEffect) == null;
    }
    return true;
  }

  public isBuildCandidate(tile: Tile | null, action: ActionBuild): tile is Tile {
    if (tile == null) {
      return false;
    }

    if (tile instanceof Cell) {
      const isFrozen = tile.findEffectOfType(FreezeEffect) != null;
      if (isFrozen) {
        return false;
      }

      return this.isMeaningfulBuild(action, tile);
    } else {
      return !tile.isObstacle;
    }
  }

  isTakingLongAction() {
    return this.action != null && this.action.type === "long";
  }

  public attemptMove(action: ActionMove, dt: number) {
    if (this.verifyMove(action, dt)) {
      // const t = this.currentTile();
      // if (t instanceof Cell) {
      //   if (t.temperature < 40) {
      //     t.nextTemperature += 0.2;
      //   }
      //   else if (t.temperature > 60) {
      //     t.nextTemperature -= 0.2;
      //   }
      // }
      footsteps.gain.gain.cancelScheduledValues(0);
      footsteps.gain.gain.value = 0.5;
      footsteps.gain.gain.linearRampToValueAtTime(0, footsteps.gain.context.currentTime + 0.05);
      // do the move
      this.posFloat.add(action.dir.clone().setLength(this.speed * dt));
      // this._pos = this.posFloat.clone().round();
      // this.autopickup();
      return true;
    } else {
      return false;
    }
  }
  public attemptStill(_dt: number) {
    // this.autopickup();
    return true;
  }
  // private autopickup() {
  //   // autopickup resources in the position as possible
  //   const cell = this.currentTile();
  //   if (hasInventory(cell)) {
  //     const inv = cell.inventory;
  //     inv.give(this.inventory, this.suckWater ? inv.water : 0, this.suckSugar ? inv.sugar : 0);
  //   }
  // }
  public tryConstructingNewCell<T extends Cell>(position: Vector2, cellType: Constructor<T>, args?: any[]) {
    position = position.clone();
    const targetTile = this.world.tileAt(position.x, position.y);
    if (targetTile == null) {
      // out of bounds/out of map
      return;
    }
    // disallow building over a seed
    if (targetTile instanceof Fruit) {
      return;
    }
    if (this.getBuildError() == null) {
      this.inventory.add(-1, -1);
      const newTile = new cellType(position, this.world, ...(args || []));
      newTile.args = args;
      build.audio.currentTime = 0;
      build.gain.gain.cancelScheduledValues(0);
      build.gain.gain.value = 0.2;
      build.gain.gain.exponentialRampToValueAtTime(0.0001, build.gain.context.currentTime + 0.5);
      return newTile;
    } else {
      return undefined;
    }
  }

  private argsEq(args1: any, args2: any) {
    if (typeof args1 !== typeof args2) {
      return false;
    }
    if (args1 == null && args2 == null) {
      return true;
    }
    if (args1 instanceof Vector2 && args2 instanceof Vector2) {
      return args1.equals(args2);
    }
    if (args1 instanceof Array && args2 instanceof Array) {
      const allEq = args1.every((_, index) => this.argsEq(args1[index], args2[index]));
      return allEq;
    }
  }

  private isMeaningfulBuild(action: ActionBuild, existingCell: Cell) {
    if (existingCell.constructor !== action.cellType) {
      return true;
    }

    if (!this.argsEq(action.args, existingCell.args)) {
      return true;
    }

    return false;
  }

  public attemptBuild(action: ActionBuild, dt: number) {
    const existingCell = this.world.cellAt(action.position.x, action.position.y);
    if (existingCell != null && !this.isMeaningfulBuild(action, existingCell)) {
      // already built, whatever.
      return true;
    }
    const matureCell = this.tryConstructingNewCell(action.position, action.cellType, action.args);
    if (matureCell == null) {
      return false;
    }

    if (existingCell) {
      this.attemptDeconstruct(
        {
          type: "deconstruct",
          position: action.position,
          force: true,
        },
        dt
      );
    }
    let cell: Cell;
    if (action.cellType.timeToBuild) {
      // immediately build if it's the same type (e.g. Transport on Transport)
      if (existingCell != null && existingCell.constructor === action.cellType) {
        cell = matureCell;
      } else {
        cell = new GrowingCell(action.position, this.world, matureCell);
      }
    } else {
      cell = matureCell;
    }
    cell.droopY = this.droopY();
    this.world.setTileAt(action.position, cell);
    return true;
  }

  public attemptDeconstruct(action: ActionDeconstruct, _dt: number): boolean {
    if (!action.position.equals(this.pos) || action.force) {
      const cell = this.world.maybeRemoveCellAt(action.position);
      if (cell != null) {
        // refund the resources back
        const refund = cell.energy / CELL_MAX_ENERGY;
        this.inventory.add(refund, refund);
        if (hasInventory(cell)) {
          cell.inventory.give(this.inventory, cell.inventory.water, cell.inventory.sugar);
        }
        return true;
      }
    }
    return false;
  }

  public attemptDrop(action: ActionDrop, dt: number) {
    // drop as much as you can onto the current tile
    const currentTile = this.currentTile();
    if (hasInventory(currentTile)) {
      const { water: waterRate, sugar: sugarRate } = action;
      const water = waterRate * dt;
      const sugar = sugarRate * dt;
      // first, pick up the opposite of what you can from the tile to try and make space
      currentTile.inventory.give(this.inventory, sugar, water);

      // give as much as you can
      this.inventory.give(currentTile.inventory, water, sugar);
      return true;
    } else {
      return false;
    }
  }

  public attemptPickup(action: ActionPickup, dt: number) {
    const cell = this.currentTile();
    if (hasInventory(cell)) {
      const inv = cell.inventory;
      inv.give(this.inventory, action.water * dt, action.sugar * dt);
    }
    return true;
  }

  public attemptMultiple(multiple: ActionMultiple, dt: number) {
    let allSuccess = true;
    for (const action of multiple.actions) {
      allSuccess = this.attemptAction(action, dt) && allSuccess;
    }
    return allSuccess;
  }

  public attemptInteract(action: ActionInteract, dt: number) {
    return action.interactable.interact(dt);
  }

  public attemptLong(action: ActionLong, dt: number) {
    if (action.elapsed === 0) {
      this.events.emit("start-long-action", action);
    }
    action.elapsed += dt;
    if (action.elapsed > action.duration) {
      this.attemptAction(action.effect, dt);
      return true;
    } else {
      return false;
    }
  }
}
