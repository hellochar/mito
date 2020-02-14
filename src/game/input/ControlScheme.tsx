import React from "react";
import { Vector2 } from "three";
import { ActionMove } from "../../core/player/action";
import { Cell } from "../../core/tile";
import { Mito } from "../../sketches/mito/index";
import { WorldDOMElement } from "../../sketches/mito/WorldDOMElement";
import { params } from "../params";
import { TileDetails } from "../ui/ingame";
import Keyboard from "./keyboard";
import { ACTION_CONTINUOUS_KEYMAP, ACTION_INSTANT_KEYMAP, MOVEMENT_KEYS } from "./keymap";

export class ControlScheme {
  private altElement?: WorldDOMElement;

  public constructor(public mito: Mito) {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  animate(_ms: number) {
    const { mito } = this;
    if (Keyboard.isAltHeld() && this.altElement == null) {
      this.altElement = mito.addWorldDOMElement(
        () => mito.getHighlightedTile()!,
        () => {
          return (
            <div className="tile-details-container">
              <TileDetails tile={mito.getHighlightedTile()} />
            </div>
          );
        }
      );
    } else if (!Keyboard.isAltHeld() && this.altElement != null) {
      mito.removeWorldDOMElement(this.altElement);
      this.altElement = undefined;
    }
    if (mito.instructionsOpen) {
      return;
    }
    // disable this for now so i can open interaction cell editor in genomeviewer
    // this.canvas.focus();
    const moveAction = this.keysToMovement(Keyboard.keyMap);
    if (moveAction) {
      mito.world.player.setAction(moveAction);
    }
    for (const key of Keyboard.keyMap) {
      if (ACTION_CONTINUOUS_KEYMAP[key]) {
        mito.world.player.setAction(ACTION_CONTINUOUS_KEYMAP[key]);
      }
    }
    if (mito.mouseDown) {
      // left
      if (mito.mouseButton === 0) {
        this.handleLeftClick();
      } else if (mito.mouseButton === 2) {
        this.handleRightClick();
      }
    }
  }

  handleKeyDown = (event: KeyboardEvent) => {
    const { mito } = this;
    const code = event.code;
    if (!event.repeat) {
      mito.maybeToggleInstructions(code);
      if (ACTION_INSTANT_KEYMAP[code]) {
        mito.world.player.setAction(ACTION_INSTANT_KEYMAP[code]);
      }
      if (code === "KeyH") {
        params.hud = !params.hud;
      }
    }
    mito.actionBar.keyDown(event);
    mito.eventEmitter.emit("keydown", event);
  };

  handleKeyUp = (event: KeyboardEvent) => {
    this.mito.eventEmitter.emit("keyup", event);
  };

  public keysToMovement(keys: Set<string>): ActionMove | null {
    const dir = new Vector2();
    for (const key of keys) {
      if (MOVEMENT_KEYS[key]) {
        dir.add(MOVEMENT_KEYS[key].dir);
      }
    }
    if (dir.x === 0 && dir.y === 0) {
      return null;
    } else {
      return {
        type: "move",
        dir,
      };
    }
  }

  public handleRightClick() {
    const { mito } = this;
    const tile = mito.getHighlightedTile();
    if (tile == null) {
      return;
    }
    mito.actionBar.rightClick(tile);
  }

  public handleLeftClick() {
    const { mito } = this;
    const target = mito.getHighlightedTile();
    if (target == null) {
      return;
    }
    mito.actionBar.leftClick(target);
  }

  public isInteract() {
    const { mito } = this;
    const tile = mito.getHighlightedTile();
    return tile != null && mito.actionBar.barFor(tile) === mito.actionBar.interactBar && tile instanceof Cell;
  }
}

export class PlayerSeedControlScheme extends ControlScheme {
  constructor(mito: Mito) {
    super(mito);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Space") {
      this.popOut();
    }
  };

  handleKeyUp = () => {};

  animate(_ms: number): void {
    const { mito } = this;
    if (mito.mouseDown) {
      // left
      if (mito.mouseButton === 0) {
        this.handleLeftClick();
      } else if (mito.mouseButton === 2) {
        this.handleRightClick();
      }
    }
  }

  public popOut() {
    if (this.mito.world.playerSeed && this.mito.world.time > 3) {
      this.mito.world.playerSeed!.popOut();
      this.mito.controls = new ControlScheme(this.mito);
    }
  }

  public keysToMovement(keys: Set<string>): ActionMove | null {
    return null;
  }

  public handleRightClick() {
    // this.popOut();
  }

  public handleLeftClick(): void {
    const clickedPos = this.mito.getHighlightPosition().round();
    if (this.mito.world.playerSeed!.pos.distanceTo(clickedPos) < 0.5) {
      this.popOut();
    }
    // this.popOut();
  }

  public isInteract(): boolean {
    return false;
  }
}
