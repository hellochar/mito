import { Vector2 } from "three";
import { CellArgs } from "../../core/cell/cell";
import { isInteractable } from "../../core/interactable";
import { ActionBuild, ActionInteract } from "../../core/player/action";
import { Cell, Tile } from "../../core/tile";
import Mito from "../mito/mito";
import Keyboard from "./keyboard";

export abstract class ActionBar {
  abstract leftClick(target: Tile): void;

  abstract rightClick(target: Tile): void;

  abstract keyDown(event: KeyboardEvent): void;
}

export class CellBar extends ActionBar {
  public get cellTypes() {
    return this.mito.world.genome.cellTypes;
  }

  private _index = 0;

  constructor(public mito: Mito) {
    super();
  }

  get selectedCell() {
    return this.cellTypes[this._index];
  }

  public scroll(delta: number) {
    if (delta < 0) {
      this.setIndex(this._index - 1);
    } else {
      this.setIndex(this._index + 1);
    }
  }

  public index() {
    return this._index;
  }

  setIndex(i: number) {
    if (i < this.cellTypes.length && i >= 0) {
      const lastIndex = this._index;
      const cellType = this.cellTypes[i];
      const direction = cellType.args && cellType.args.direction;
      if (lastIndex === i && direction != null) {
        direction
          .rotateAround(new Vector2(), -Math.PI / 4)
          .setLength(1)
          .round();
      }
      this._index = i;
    }
  }

  leftClick(target: Tile) {
    const { world } = this.mito;
    if (world.player.canBuildAt(target)) {
      let args: CellArgs | undefined;
      const cellType = this.selectedCell;
      if (cellType.args) {
        args = { ...cellType.args };
      }

      const action: ActionBuild = {
        type: "build",
        cellType: this.selectedCell,
        position: target.pos.clone(),
        args,
      };
      this.mito.world.player.setAction(action);
    }
  }

  rightClick(tile: Tile) {}

  keyDown(event: KeyboardEvent) {
    if (this.shouldCapture(event)) {
      this.setIndex(CELL_BAR_KEYS[event.code]);
    }
  }

  shouldCapture(event: KeyboardEvent) {
    return !event.repeat && CELL_BAR_KEYS[event.code] != null;
  }
}

export const CELL_BAR_KEYS: Record<string, number> = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Digit5: 4,
};

export class InteractBar extends ActionBar {
  constructor(public mito: Mito) {
    super();
  }

  leftClick(target: Tile) {
    if (isInteractable(target)) {
      const action: ActionInteract = {
        type: "interact",
        interactable: target,
      };
      this.mito.world.player.setAction(action);
    }
  }

  rightClick(tile: Tile): void {
    if (tile instanceof Cell && tile.isReproductive) {
      return; // disallow deleting reproductive cells
    }
    this.mito.world.player.setAction({
      type: "deconstruct",
      position: tile.pos,
    });
  }

  keyDown(event: KeyboardEvent): void {
    // nothing for now
  }

  shouldCapture(event: KeyboardEvent) {
    return !event.repeat && event.code === "Space";
  }
}

export class SwitchableBar extends ActionBar {
  public current: CellBar | InteractBar;

  constructor(public buildBar: CellBar, public interactBar: InteractBar) {
    super();
    this.current = buildBar;
  }

  get other() {
    return this.current === this.buildBar ? this.interactBar : this.buildBar;
  }

  setToInteract() {
    this.current = this.interactBar;
  }

  setToBuild() {
    this.current = this.buildBar;
  }

  leftClick(target: Tile) {
    this.current.leftClick(target);
  }

  rightClick(target: Tile): void {
    this.current.rightClick(target);
  }

  keyDown(event: KeyboardEvent) {
    if (this.buildBar.shouldCapture(event)) {
      this.current = this.buildBar;
    } else if (this.interactBar.shouldCapture(event)) {
      this.current = this.interactBar;
    }
    // if (!event.repeat && event.code === "Space") {
    //   this.current = this.other;
    // }
    this.current.keyDown(event);
  }
}

export class AltHeldBar extends ActionBar {
  public buildBar = new CellBar(this.mito);

  public interactBar = new InteractBar(this.mito);

  constructor(public mito: Mito) {
    super();
  }

  barFor(target: Tile) {
    if (target instanceof Cell || Keyboard.isAltHeld()) {
      return this.interactBar;
    } else {
      return this.buildBar;
    }
  }

  leftClick(target: Tile) {
    this.barFor(target).leftClick(target);
  }

  rightClick(target: Tile) {
    this.barFor(target).rightClick(target);
  }

  keyDown(event: KeyboardEvent) {
    this.buildBar.keyDown(event);
  }
}
