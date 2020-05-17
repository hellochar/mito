import { EventEmitter } from "events";
import { params } from "game/params";
import { maxBy, minBy } from "lodash";
import { Vector2 } from "three";
import { Cell, GrowingCell } from "./cell";
import { PLAYER_INTERACT_EXCHANGE_SPEED } from "./constants";
import { Steppable } from "./entity";
import { Inventory } from "./inventory";
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
} from "./player/action";
import { Air, Tile } from "./tile";
import { World } from "./world/world";
export class Insect implements Steppable {
  private events = new EventEmitter();

  public inventory = new Inventory(10, this);

  private action?: Action;

  public dtSinceLastStepped = 0;

  public speed: number = 3.2;

  get pos() {
    return this.posFloat.clone().round();
  }

  constructor(public posFloat: Vector2, public world: World) {
    posFloat.clamp(world.minVector, world.maxVector);
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
      if (action.type === "build" && action.cellType.chromosome.computeStaticProperties().isReproductive) {
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

  public off(event: string, cb: (...args: any[]) => void) {
    this.events.off(event, cb);
  }

  public step(dt: number) {
    // this.maybeMoveWithTransports(dt);
    // if (!this.isWalkable(this.currentTile())) {
    //   const nearestWalkableCell = this.findNearestWalkableCell();
    //   if (nearestWalkableCell != null) {
    //     this.world.logEvent({
    //       type: "oof",
    //       from: this.posFloat,
    //       to: nearestWalkableCell,
    //     });
    //     this.posFloat.copy(nearestWalkableCell.pos);
    //   }
    // }
    if (this.action == null) {
      this.findNextAction();
    }
    if (this.action != null) {
      this.attemptAction(this.action, dt);
      if (this.action.type !== "long") {
        this.action = undefined;
      }
    }
  }

  public findNextAction() {
    // if we don't have food, find a Cell and eat it
    // const thisDist = this.currentTile().closestCellDistance;
    const neighbors = this.world
      .tileNeighbors(this.pos)
      .array.filter((t) => t.pos.manhattanDistanceTo(this.pos) < 2 && (Air.is(t) || Cell.is(t)));
    if (this.inventory.sugar < 1) {
      const target = minBy(neighbors, (tile) => tile.closestCellAirDistance);
      if (Air.is(target)) {
        this.setAction({
          type: "move",
          dir: target.pos
            .clone()
            .sub(this.posFloat)
            .normalize(),
        });
      } else if (Cell.is(target)) {
        this.setAction({
          type: "deconstruct",
          position: target.pos,
          force: true,
        });
        // this.setAction({
        //   type: "long",
        //   duration: 3,
        //   effect: {
        //     type: "deconstruct",
        //     position: target.pos,
        //     force: true,
        //   },
        //   elapsed: 0,
        // });
      }
    } else {
      // insect is full; run away
      const target = maxBy(neighbors, (tile) => tile.closestCellAirDistance);
      if (this.world.isAtEdge(this.pos)) {
        this.world.removeInsect(this);
      }
      if (target != null) {
        this.setAction({
          type: "move",
          dir: target.pos
            .clone()
            .sub(this.posFloat)
            .normalize(),
        });
      }
    }
  }

  public attemptAction(action: Action, dt: number) {
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

  public isWalkable(pos: Tile): pos is Air;

  public isWalkable(pos: Vector2): boolean;

  public isWalkable(pos: Tile | Vector2) {
    const tile = pos instanceof Vector2 ? this.world.tileAt(Math.round(pos.x), Math.round(pos.y)) : pos;
    if (!Air.is(tile) || tile.isObstacle) {
      // can't move!
      return false;
    }
    return true;
  }

  public canBuildAt(tile: Tile | null): tile is Tile {
    if (tile == null) {
      return false;
    } else if (Cell.is(tile)) {
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
      // if (Cell.is(t)) {
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

  public canBuild(action: ActionBuild): true | string {
    const existingTile = this.world.tileAt(action.position);
    if (!this.canBuildAt(existingTile)) {
      return `Can't build over ${existingTile!.displayName}!`;
    }
    const existingCell = this.world.cellAt(action.position.x, action.position.y);
    if (existingCell != null) {
      // don't allow building over
      return `Deconstruct ${existingCell.displayName} first!`;
    }

    const { costSugar, costWater } = action.cellType.chromosome.computeStaticProperties();

    const needWater = this.inventory.water < costWater;
    const needSugar = this.inventory.sugar < costSugar;

    if (needWater && needSugar) {
      return "Need water and sugar!";
    } else if (needWater && !needSugar) {
      return "Need water!";
    } else if (needSugar && !needWater) {
      return "Need sugar!";
    }

    return true;
  }

  public attemptBuild(action: ActionBuild, dt: number) {
    const canBuild = this.canBuild(action);
    if (canBuild !== true) {
      return canBuild;
    }

    const { costSugar, costWater } = action.cellType.chromosome.computeStaticProperties();
    this.inventory.add(-costWater, -costSugar);
    const matureCell = new Cell(action.position, this.world, action.cellType, action.args);

    let cell: Cell;
    if (action.cellType.chromosome.computeStaticProperties().timeToBuild > 0) {
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
    this.world.setTileAt(action.position, cell);
    return true;
  }

  /**
   * For insects, this is actually a "destroy" where it gets your resources
   * and
   */
  public attemptDeconstruct(action: ActionDeconstruct, _dt: number): boolean {
    const cell = this.world.cellAt(action.position);
    if (cell != null) {
      cell.inventory.give(this.inventory, cell.inventory.water, cell.inventory.sugar);
      const { costSugar, costWater } = cell.type.chromosome.computeStaticProperties();
      this.inventory.add(costWater, costSugar);
      this.world.maybeRemoveCellAt(cell.pos);
      return true;
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

  /**
   * long actions are reponsible for unsetting themselves.
   */
  public attemptLong(action: ActionLong, dt: number) {
    if (action.elapsed === 0) {
      // verify builds
      if (action.effect.type === "build") {
        const canBuild = this.canBuild(action.effect);
        if (canBuild !== true) {
          this.action = undefined;
          return canBuild;
        }
      }
      this.events.emit("start-long-action", action);
    }
    action.elapsed += dt;
    if (action.elapsed > action.duration) {
      this.action = undefined;
      const result = this.attemptAction(action.effect, dt);
      return result;
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
