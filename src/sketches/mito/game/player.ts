import { EventEmitter } from "events";
import { Vector2 } from "three";
import { traitMod } from "../../../evolution/traits";
import { Action, ActionBuild, ActionDeconstruct, ActionDrop, ActionInteract, ActionMove, ActionMultiple, ActionPickup } from "../action";
import { build, footsteps } from "../audio";
import { Constructor } from "../constructor";
import { hasInventory, Inventory } from "../inventory";
import { params } from "../params";
import { Steppable } from "./entity";
import { Cell, FreezeEffect, Fruit, GrowingCell, Tile, Transport } from "./tile";
import { World } from "./world";

export class Player implements Steppable {
  public inventory = new Inventory(
    params.maxResources,
    this,
    Math.round(params.maxResources / 3),
    Math.round(params.maxResources / 3)
  );
  private action?: Action;
  private events = new EventEmitter();
  public mapActions?: (player: Player, action: Action) => Action | undefined;
  // public speed: number;
  // public dropWater = false;
  // public dropSugar = false;
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
    this.baseSpeed = traitMod(world.traits.walkSpeed, 0.15, 1.5);
  }

  shouldStep() {
    return true;
  }

  public setAction(action: Action) {
    if (this.action != null) {
      this.action = {
        type: "multiple",
        actions: [this.action, action],
      };
    } else {
      this.action = action;
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

  public on(event: string, cb: (...args: any[]) => void) {
    this.events.on(event, cb);
  }

  public step(dt: number) {
    if (this.action === undefined) {
      this.action = { type: "none" };
    }
    if (this.mapActions) {
      const mappedAction = this.mapActions(this, this.action);
      if (mappedAction != null) {
        this.action = mappedAction;
      } else {
        this.action = { type: "none" };
      }
    }
    const actionSuccessful = this.attemptAction(this.action, dt);
    this.maybeMoveWithTransports(dt);
    // if (this.dropWater) {
    //   this.attemptAction(ACTION_KEYMAP.q);
    // }
    // if (this.dropSugar) {
    //   this.attemptAction(ACTION_KEYMAP.e);
    // }
    if (actionSuccessful) {
      this.events.emit("action", this.action);
    }
    this.action = undefined;
  }

  private maybeMoveWithTransports(dt: number) {
    const tile = this.currentTile();
    if (tile instanceof Transport) {
      this.posFloat.add(tile.dir.clone().setLength(this.speed * 0.15 * dt));
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

  public isBuildCandidate(tile: Tile | null): tile is Tile {
    if (tile != null && !tile.isObstacle) {
      if (tile instanceof Cell) {
        return tile.findEffectOfType(FreezeEffect) == null;
      }
      return true;
    } else {
      return false;
    }
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
  public tryConstructingNewCell<T extends Cell>(position: Vector2, cellType: Constructor<T>, args: any[]) {
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
    const waterCost = 1;
    const sugarCost = 1;
    const tileAlreadyExists =
      targetTile instanceof cellType && !((cellType as any) === Transport && targetTile instanceof Transport);
    if (
      !tileAlreadyExists &&
      !targetTile.isObstacle &&
      this.inventory.water >= waterCost &&
      this.inventory.sugar >= sugarCost
    ) {
      this.inventory.add(-waterCost, -sugarCost);
      const newTile = new cellType(position, this.world, ...args);
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
    if (existingCell) {
      this.attemptDeconstruct({
        type: "deconstruct",
        position: action.position,
        force: true,
      }, dt);
    }
    const matureCell = this.tryConstructingNewCell(action.position, action.cellType, action.args);
    if (matureCell != null) {
      let cell: Cell;
      if (action.cellType.turnsToBuild) {
        cell = new GrowingCell(action.position, this.world, matureCell);
      } else {
        cell = matureCell;
      }
      cell.droopY = this.droopY();
      this.world.setTileAt(action.position, cell);
      return true;
    } else {
      return false;
    }
  }

  public attemptDeconstruct(action: ActionDeconstruct, _dt: number): boolean {
    if (!action.position.equals(this.pos) || action.force) {
      const cell = this.world.maybeRemoveCellAt(action.position);
      if (cell != null) {
        // refund the resources back
        const refund = cell.energy / params.cellEnergyMax;
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
    action.interactable.interact(dt);
    return true;
  }
}
