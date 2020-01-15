import { Vector2 } from "three";
import Mito from ".";
import { ActionBuild, ActionInteract } from "./action";
import { isInteractable } from "./game/interactable";
import { Cell, Fruit, Tile, Transport } from "./game/tile";
import { CellArgs } from "./game/tile/cell";
import { cellTypeFruit } from "./game/tile/fruit";
import { cellTypeLeaf } from "./game/tile/leaf";
import { cellTypeRoot } from "./game/tile/root";
import { cellTypeTissue } from "./game/tile/tissue";
import { cellTypeTransport } from "./game/tile/transport";

export abstract class ActionBar {
  abstract leftClick(target: Tile): void;
  abstract rightClick(target: Tile): void;
  abstract keyDown(event: KeyboardEvent): void;
}

export class CellBar extends ActionBar {
  public bar = [cellTypeTissue, cellTypeLeaf, cellTypeRoot, cellTypeTransport, cellTypeFruit] as const;
  private _index = 0;

  constructor(public mito: Mito) {
    super();
  }

  get selectedCell() {
    return this.bar[this._index];
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
    const lastIndex = this._index;
    if (lastIndex === i && this.bar[i] === cellTypeTransport) {
      Transport.buildDirection
        .rotateAround(new Vector2(), -Math.PI / 4)
        .setLength(1)
        .round();
    }
    this._index = ((i % this.bar.length) + this.bar.length) % this.bar.length;
  }

  leftClick(target: Tile) {
    const { world } = this.mito;
    if (world.player.canBuildAt(target)) {
      let args: CellArgs | undefined;
      const cellType = world.genome.cellTypes.find((cType) => cType === this.selectedCell)!;
      if (cellType.chromosome.mergeStaticProperties().isDirectional) {
        args = {
          direction: Transport.buildDirection.clone(),
        };
        // const highlightVector = this.getHighlightVector();
        // const roundedHighlightVector = highlightVector.setLength(1).round();
        // args.push(roundedHighlightVector);
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
    if (tile instanceof Fruit) {
      return; // disallow deleting fruit
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
    if (target instanceof Cell || this.mito.isAltHeld()) {
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
