import { Cell } from "core/cell";
import { ActionMove } from "core/player/action";
import { Vector2 } from "three";
import { Mito } from "../mito/mito";
import Keyboard from "./keyboard";
import { ACTION_CONTINUOUS_KEYMAP, ACTION_INSTANT_KEYMAP, MOVEMENT_KEYS } from "./keymap";

export interface ControlScheme {
  animate(ms: number): void;

  destroy(): void;

  wouldLeftClickInteract(): boolean;
}

export class PlayerControlScheme implements ControlScheme {
  public constructor(public mito: Mito) {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("mousedown", this.handleMouseDown);
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("mousedown", this.handleMouseDown);
  }

  handleMouseDown = (event: MouseEvent) => {
    if (event.target instanceof HTMLCanvasElement) {
      if (event.button === 0) {
        if (this.mito.inspectedCell != null) {
          this.mito.inspectedCell = undefined;
        } else {
          this.handleLeftClick();
        }
      } else if (event.button === 2) {
        if (this.mito.inspectedCell != null) {
          this.mito.inspectedCell = undefined;
        } else {
          const tile = this.mito.getHighlightedTile();
          if (tile == null) {
            return;
          }
          if (tile instanceof Cell) {
            this.mito.inspectedCell = tile;
          }
        }
        // this.mito.inspectedCell = undefined;
      }
    }
  };

  animate(_ms: number) {
    const { mito } = this;
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
  }

  handleKeyDown = (event: KeyboardEvent) => {
    const { mito } = this;
    const code = event.code;
    if (!event.repeat) {
      const instructionsCapturedEvent = mito.maybeToggleInstructions(code);
      if (instructionsCapturedEvent) {
        return;
      }
      if (ACTION_INSTANT_KEYMAP[code]) {
        mito.world.player.setAction(ACTION_INSTANT_KEYMAP[code]);
      } else if (mito.inspectedCell != null && code === "Escape") {
        mito.inspectedCell = undefined;
      }
    }
    mito.toolBar.keyDown(event);
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
    // const { mito } = this;
    // if (mito.inspectedCell != null) {
    //   mito.inspectedCell = undefined;
    // } else {
    //   const tile = mito.getHighlightedTile();
    //   if (tile == null) {
    //     return;
    //   }
    //   if (tile instanceof Cell) {
    //     mito.inspectedCell = tile;
    //   }
    //   // const action = mito.actionBar.rightClick(tile);
    //   // if (action) {
    //   //   mito.world.player.setAction(action);
    //   // }
    // }
  }

  public handleLeftClick() {
    const { mito } = this;
    const target = mito.getHighlightedTile();
    if (target == null) {
      return;
    }
    const action = mito.toolBar.leftClick(target);
    if (action) {
      mito.world.player.setAction(action);
    }
  }

  public wouldLeftClickInteract() {
    const { mito } = this;
    const tile = mito.getHighlightedTile();
    // return tile != null && mito.actionBar.leftClick(tile)?.type === "interact";
    const type = tile && mito.toolBar.leftClick(tile)?.type;
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
