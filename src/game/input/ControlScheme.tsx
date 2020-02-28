import React from "react";
import { Vector2 } from "three";
import { ActionMove } from "../../core/player/action";
import { Mito } from "../mito/mito";
import { WorldDOMElement } from "../mito/WorldDOMElement";
import { params } from "../params";
import Keyboard from "./keyboard";
import { ACTION_CONTINUOUS_KEYMAP, ACTION_INSTANT_KEYMAP, MOVEMENT_KEYS } from "./keymap";

export interface ControlScheme {
  animate(ms: number): void;

  destroy(): void;

  wouldLeftClickInteract(): boolean;
}

export class PlayerControlScheme implements ControlScheme {
  private altElement?: WorldDOMElement;

  public constructor(public mito: Mito) {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  animate(_ms: number) {
    const { mito } = this;
    if (
      // Keyboard.shouldShowInMapPopup() &&
      this.altElement == null &&
      mito.actionBar.current === mito.actionBar.toolBar
    ) {
      this.altElement = mito.addWorldDOMElement(
        () => mito.getHighlightedTile()!,
        () => {
          const toolBar = mito.actionBar.toolBar;
          const tool = toolBar.tools[toolBar.currentTool!];
          return (
            <div className="tile-details-container">
              {/* <TileDetails tile={mito.getHighlightedTile()} /> */}
              <div style={{ padding: 10, background: "white", borderRadius: 5 }}>
                {tool ? "Click to " + tool.name : null}
              </div>
            </div>
          );
        }
      );
    } else if (this.altElement != null && mito.actionBar.current !== mito.actionBar.toolBar) {
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
      if (code === "Slash") {
        params.showGodUI = !params.showGodUI;
      }
    }
    mito.actionBar.keyDown(event);
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
    const action = mito.actionBar.rightClick(tile);
    if (action) {
      mito.world.player.setAction(action);
    }
  }

  public handleLeftClick() {
    const { mito } = this;
    const target = mito.getHighlightedTile();
    if (target == null) {
      return;
    }
    const action = mito.actionBar.leftClick(target);
    if (action) {
      mito.world.player.setAction(action);
    }
  }

  public wouldLeftClickInteract() {
    const { mito } = this;
    const tile = mito.getHighlightedTile();
    // return tile != null && mito.actionBar.leftClick(tile)?.type === "interact";
    const type = tile && mito.actionBar.leftClick(tile)?.type;
    return type === "interact" || type === "pickup" || type === "drop";
  }
}

export class PlayerSeedControlScheme implements ControlScheme {
  handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Space") {
      this.popOut();
    }
  };

  constructor(public mito: Mito) {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  animate(_ms: number): void {
    const { mito } = this;
    if (mito.mouseDown) {
      // left
      if (mito.mouseButton === 0) {
        this.handleLeftClick();
      }
    }
  }

  public popOut() {
    if (this.mito.world.playerSeed && this.mito.world.time > 3) {
      this.mito.world.playerSeed!.popOut();
      this.mito.controls = new PlayerControlScheme(this.mito);
    }
  }

  public handleLeftClick(): void {
    const clickedPos = this.mito.getHighlightPosition().round();
    if (this.mito.world.playerSeed!.pos.distanceTo(clickedPos) < 0.5) {
      this.popOut();
    }
  }

  public wouldLeftClickInteract() {
    return false;
  }
}
