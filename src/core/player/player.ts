import { sleep } from "common/promise";
import { EventEmitter } from "events";
import { params } from "game/params";
import { Vector2 } from "three";
import {
  PLAYER_BASE_SPEED,
  PLAYER_INTERACT_EXCHANGE_SPEED,
  PLAYER_MAX_RESOURCES,
  PLAYER_STARTING_SUGAR,
  PLAYER_STARTING_WATER,
} from "../constants";
import { Steppable } from "../entity";
import { Inventory } from "../inventory";
import { Air, Cell, FreezeEffect, GrowingCell, Tile } from "../tile";
import { World } from "../world/world";
import {
  Action,
  ActionBuild,
  ActionDeconstruct,
  ActionDrop,
  ActionLong,
  ActionMove,
  ActionMultiple,
  ActionPickup,
  ActionRemoveCancer,
  ActionThaw,
} from "./action";

export class Player implements Steppable {
  public inventory = new Inventory(PLAYER_MAX_RESOURCES, this, PLAYER_STARTING_WATER, PLAYER_STARTING_SUGAR);

  private action?: Action;

  private events = new EventEmitter();

  public baseSpeed: number;

  public dtSinceLastStepped = 0;

  public get speed() {
    const t = this.currentTile();
    return this.baseSpeed * (t instanceof Cell ? t.getMovespeedMultiplier() : 1);
  }

  get pos() {
    return this.posFloat.clone().round();
  }

  public constructor(public posFloat: Vector2, public world: World) {
    this.baseSpeed = PLAYER_BASE_SPEED;
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
      if (action.type === "build" && action.cellType.chromosome.getStaticProperties().isReproductive) {
        this.action = {
          type: "long",
          duration: 4.5,
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

  /**
   * Get this player's position taking into
   * account the droop of the cell it's on.
   */
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

  public findNearestWalkableCell() {
    for (const tile of this.world.bfsIterator(this.pos, this.world.width * this.world.height)) {
      if (this.isWalkable(tile)) {
        return tile;
      }
    }
  }

  public on(event: "action", cb: (action: Action) => void): void;

  public on(event: "action-fail", cb: (action: Action, reason?: string) => void): void;

  public on(event: "start-long-action", cb: (action: ActionLong) => void): void;

  public on(event: string, cb: (...args: any[]) => void) {
    this.events.on(event, cb);
  }

  public step(dt: number) {
    // this.maybeMoveWithTransports(dt);
    if (!this.isWalkable(this.currentTile())) {
      const nearestWalkableCell = this.findNearestWalkableCell();
      if (nearestWalkableCell != null) {
        this.world.logEvent({
          type: "oof",
          from: this.posFloat,
          to: nearestWalkableCell,
        });
        this.posFloat.copy(nearestWalkableCell.pos);
      }
    }
    if (this.action != null) {
      const result = this.attemptAction(this.action, dt);
      if (this.action.type === "long") {
        if (result === true) {
          this.action = undefined;
        }
      } else {
        this.action = undefined;
      }
    }
  }

  public attemptAction(action: Action, dt: number): boolean | string {
    const result = this._attemptAction(action, dt);
    if (params.showGodUI) {
      console.log(action);
    }
    if (result === true) {
      this.events.emit("action", action);
    } else {
      this.events.emit("action-fail", action, result === false ? undefined : result);
    }
    return result;
  }

  private _attemptAction(action: Action, dt: number): boolean | string {
    switch (action.type) {
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
      case "long":
        return this.attemptLong(action, dt);
      case "thaw":
        return this.attemptThaw(action, dt);
      case "remove-cancer":
        return this.attemptRemoveCancer(action, dt);
    }
  }

  public isWalkable(pos: Tile): pos is Cell;

  public isWalkable(pos: Vector2): boolean;

  public isWalkable(pos: Tile | Vector2) {
    const tile = pos instanceof Vector2 ? this.world.tileAt(Math.round(pos.x), Math.round(pos.y)) : pos;
    if (!(tile instanceof Cell) || tile.isObstacle) {
      // can't move!
      return false;
    }
    if (tile instanceof Cell) {
      return tile.findEffectOfType(FreezeEffect) == null;
    }
    return true;
  }

  public canBuildAt(tile: Tile | null): tile is Tile {
    if (tile == null) {
      return false;
    } else if (tile instanceof Cell) {
      return false;
    } else {
      return !tile.isObstacle;
    }
  }

  isTakingLongAction() {
    return this.action != null && this.action.type === "long";
  }

  public attemptMove(action: ActionMove, dt: number) {
    const nextPos = this.posFloat.clone().add(action.dir.clone().setLength(this.speed * dt));
    if (this.isWalkable(nextPos)) {
      // const t = this.currentTile();
      // if (t instanceof Cell) {
      //   if (t.temperature < 40) {
      //     t.nextTemperature += 0.2;
      //   }
      //   else if (t.temperature > 60) {
      //     t.nextTemperature -= 0.2;
      //   }
      // }
      // do the move
      this.posFloat.copy(nextPos);
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

  public attemptBuild(action: ActionBuild, dt: number) {
    if (!this.canBuildAt(this.world.tileAt(action.position))) {
      return false;
    }
    const existingCell = this.world.cellAt(action.position.x, action.position.y);
    if (existingCell != null) {
      // don't allow building over
      return false;
    }

    const { costSugar, costWater } = action.cellType.chromosome.getStaticProperties();

    const needWater = this.inventory.water < costWater;
    const needSugar = this.inventory.sugar < costSugar;

    if (needWater && needSugar) {
      return "Need water and sugar!";
    } else if (needWater && !needSugar) {
      return "Need water!";
    } else if (needSugar && !needWater) {
      return "Need sugar!";
    }

    this.inventory.add(-costWater, -costSugar);
    const matureCell = new Cell(action.position, this.world, action.cellType, action.args);
    if (matureCell == null) {
      return false;
    }

    let cell: Cell;
    if (action.cellType.chromosome.getStaticProperties().timeToBuild) {
      // special - drop a sugar when you grow, to cover for the sugar
      // this.attemptDrop(
      //   {
      //     type: "drop",
      //     sugar: 1 / dt,
      //     water: 0,
      //   },
      //   dt
      // );
      cell = new GrowingCell(action.position, this.world, matureCell, this.currentTile().pos);
      // this.inventory.give(cell.inventory, 0, 1);
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
        if (cell instanceof GrowingCell) {
          // refund the resources back
          const { costSugar, costWater } = cell.completedCell.type.chromosome.getStaticProperties();
          this.inventory.add(costWater, costSugar);
        }

        // maybeRemoveCellAt has already tried redistributing inventory to neighbors,
        // but if it couldn't do that, as a last ditch, give resources directly to
        // the player
        cell.inventory.give(this.inventory, cell.inventory.water, cell.inventory.sugar);
        return true;
      }
    }
    return false;
  }

  public attemptDrop(action: ActionDrop, dt: number) {
    // drop as much as you can onto the current tile
    const target = action.target;
    let { water: waterToDrop, sugar: sugarToDrop } = action;
    if (action.continuous) {
      waterToDrop *= PLAYER_INTERACT_EXCHANGE_SPEED * dt;
      sugarToDrop *= PLAYER_INTERACT_EXCHANGE_SPEED * dt;
    }

    const { water, sugar } = this.inventory.give(target.inventory, waterToDrop, sugarToDrop);
    return water > 0 || sugar > 0;
  }

  public attemptPickup(action: ActionPickup, dt: number) {
    const target = action.target;
    const inv = target.inventory;

    let { water: waterToDrop, sugar: sugarToDrop } = action;
    if (action.continuous) {
      waterToDrop *= PLAYER_INTERACT_EXCHANGE_SPEED * dt;
      sugarToDrop *= PLAYER_INTERACT_EXCHANGE_SPEED * dt;
    }
    const { water, sugar } = inv.give(this.inventory, waterToDrop, sugarToDrop);
    return water > 0 || sugar > 0;
  }

  public attemptMultiple(multiple: ActionMultiple, dt: number) {
    let allSuccess = true;
    for (const action of multiple.actions) {
      allSuccess = this.attemptAction(action, dt) === true && allSuccess;
    }
    return allSuccess;
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

  public attemptThaw(action: ActionThaw, dt: number) {
    const { target } = action;
    target.thaw(dt);
    return true;
  }

  public attemptRemoveCancer(action: ActionRemoveCancer, dt: number) {
    const { target } = action;
    target.removeCancer(dt);
    return true;
  }
}

export class PlayerSeed implements Steppable {
  public readonly inventory = new Inventory(0, this);

  public dtSinceLastStepped = 0;

  private poppedOut = false;

  public constructor(public posFloat: Vector2, public world: World, public player: Player) {}

  shouldStep(): boolean {
    return true;
  }

  get pos() {
    return this.posFloat.clone().round();
  }

  step(dt: number): void {
    const pos = this.pos;
    const tileBelow = this.world.tileAt(pos.x, pos.y + 1);
    if (tileBelow instanceof Air) {
      // can keep going
      const velY = Math.min(20 * dt, 1);
      this.posFloat.y += velY;
    } else {
    }
    this.player.posFloat.copy(this.posFloat);
    if (this.poppedOut) {
      this.world.removePlayerSeed();
    }
  }

  popOut() {
    const start = this.pos;
    const c = new Cell(start, this.world, this.world.genome.cellTypes[0]);
    const growingCell = new GrowingCell(start, this.world, c, start);
    growingCell.silent = true;
    this.world.setTileAt(start, growingCell);
    Array.from(
      this.world.bfsIterator(
        start,
        30,
        (t) => !t.isObstacle && t.pos.distanceTo(start) < 2.5,
        (t) => t.pos.distanceTo(start)
      )
    ).forEach((tile, i) => {
      sleep(300).then(() => {
        const cell = new Cell(tile.pos, this.world, this.world.genome.cellTypes[0]);
        // const growingCell = new GrowingCell(tile.pos, this.world, cell, start);
        this.world.setTileAt(tile.pos, cell);
      });
    });
    this.poppedOut = true;
  }
}
