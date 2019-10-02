import { EventEmitter } from "events";
import { Vector2 } from "three";
import { Action, ActionBuild, ActionDeconstruct, ActionDrop, ActionMove, ActionMultiple, ActionPickup } from "../action";
import { build, footsteps } from "../audio";
import { Constructor } from "../constructor";
import { hasInventory, Inventory } from "../inventory";
import { params } from "../params";
import { Cell, Fruit, GrowingCell, Tile, Transport } from "./tile";
import { World } from "./world";
import { Steppable } from "./entity";
import { traitMod } from "../../../evolution/traits";

export class Player implements Steppable {
  public inventory = new Inventory(params.maxResources, this, Math.round(params.maxResources / 3), Math.round(params.maxResources / 3));
  private action?: Action;
  private events = new EventEmitter();
  public mapActions?: (player: Player, action: Action) => Action | undefined;
  public speed: number;
  // public dropWater = false;
  // public dropSugar = false;

  get pos() {
    return this.posFloat.clone().round();
  }

  public constructor(public posFloat: Vector2, public world: World) {
    this.speed = traitMod(world.traits.walkSpeed, 0.15, 1.5);
  }

  public setAction(action: Action) {
    if (this.action != null) {
      this.action = {
        type: "multiple",
        actions: [this.action, action]
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
    return this.world.tileAt(this.pos);
  }

  public on(event: string, cb: (...args: any[]) => void) {
    this.events.on(event, cb);
  }

  public step() {
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
    const actionSuccessful = this.attemptAction(this.action);
    this.maybeMoveWithTransports();
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

  private maybeMoveWithTransports() {
    const tile = this.currentTile();
    if (tile instanceof Transport) {
      this.posFloat.add(tile.dir.clone().setLength(this.speed * 0.15));
    }
  }

  public attemptAction(action: Action): boolean {
    switch (action.type) {
      case "none":
        // literally do nothing
        return true;
      case "still":
        return this.attemptStill();
      case "move":
        return this.attemptMove(action);
      case "build":
        return this.attemptBuild(action);
      case "deconstruct":
        return this.attemptDeconstruct(action);
      case "drop":
        return this.attemptDrop(action);
      case "pickup":
        return this.attemptPickup(action);
      case "multiple":
        return this.attemptMultiple(action);
    }
  }
  public verifyMove(action: ActionMove) {
    const target = this.posFloat.clone().add(action.dir.clone().setLength(this.speed)).round();
    return this.isWalkable(target);
  }

  public isWalkable(pos: Tile | Vector2) {
    if (pos instanceof Tile) {
      pos = pos.pos;
    }
    if (!this.world.isValidPosition(pos.x, pos.y)) {
      return false;
    }
    const targetTile = this.world.tileAt(pos.x, pos.y);
    if (!(targetTile instanceof Cell) || targetTile == null || targetTile.isObstacle) {
      // can't move!
      return false;
    }
    return true;
  }

  public isBuildCandidate(tile: Tile | null): tile is Tile {
    if (tile != null && !tile.isObstacle) {
      return true;
    } else {
      return false;
    }
  }

  public attemptMove(action: ActionMove) {
    if (this.verifyMove(action)) {
      footsteps.audio.currentTime = Math.random() * 0.05;
      footsteps.gain.gain.cancelScheduledValues(0);
      footsteps.gain.gain.value = 1.0;
      footsteps.gain.gain.linearRampToValueAtTime(0, footsteps.gain.context.currentTime + 0.05);
      // do the move
      this.posFloat.add(action.dir.clone().setLength(this.speed));
      // this._pos = this.posFloat.clone().round();
      // this.autopickup();
      return true;
    } else {
      return false;
    }
  }
  public attemptStill() {
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
    const tileAlreadyExists = targetTile instanceof cellType && !((cellType as any) === Transport && targetTile instanceof Transport);
    if (!tileAlreadyExists &&
      !targetTile.isObstacle &&
      this.inventory.water >= waterCost &&
      this.inventory.sugar >= sugarCost) {
      this.inventory.add(-waterCost, -sugarCost);
      const newTile = new cellType(position, this.world, ...args);
      newTile.args = args;
      build.audio.currentTime = 0;
      build.gain.gain.cancelScheduledValues(0);
      build.gain.gain.value = 0.2;
      build.gain.gain.exponentialRampToValueAtTime(0.0001, build.gain.context.currentTime + 0.50);
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

  public attemptBuild(action: ActionBuild) {
    const existingCell = this.world.cellAt(action.position.x, action.position.y);
    if (existingCell != null && !this.isMeaningfulBuild(action, existingCell)) {
      // already built, whatever.
      return true;
    }
    if (existingCell) {
      this.attemptDeconstruct({ type: "deconstruct", position: action.position, force: true });
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

  public attemptDeconstruct(action: ActionDeconstruct): boolean {
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

  public attemptDrop(action: ActionDrop) {
    // drop as much as you can onto the current tile
    const currentTile = this.currentTile();
    if (hasInventory(currentTile)) {
      const { water, sugar } = action;
      // first, pick up the opposite of what you can from the tile to try and make space
      currentTile.inventory.give(this.inventory, sugar, water);

      // give as much as you can
      this.inventory.give(currentTile.inventory, water, sugar);
      return true;
    } else {
      return false;
    }
  }

  public attemptPickup(action: ActionPickup) {
    const cell = this.currentTile();
    if (hasInventory(cell)) {
      const inv = cell.inventory;
      inv.give(this.inventory, action.water, action.sugar);
    }
    return true;
    // // drop as much as you can onto the current tile
    // const currentTile = this.currentTile();
    // if (hasInventory(currentTile)) {
    //   const { water, sugar } = action;
    //   // first, pick up the opposite of what you can from the tile to try and make space
    //   currentTile.inventory.give(this.inventory, sugar, water);

    //   // give as much as you can
    //   this.inventory.give(currentTile.inventory, water, sugar);
    //   return true;
    // } else {
    //   return false;
    // }
  }

  public attemptMultiple(multiple: ActionMultiple) {
    let allSuccess = true;
    for (const action of multiple.actions) {
      allSuccess = this.attemptAction(action) && allSuccess;
    }
    return allSuccess;
  }
}
