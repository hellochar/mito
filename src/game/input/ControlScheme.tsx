import { Cell } from "core/cell";
import { ActionMove, isContinuous } from "core/player/action";
import { Vector2 } from "three";
import { Mito } from "../mito/mito";
import Keyboard from "./keyboard";
import { ACTION_CONTINUOUS_KEYMAP, ACTION_INSTANT_KEYMAP, MOVEMENT_KEYS } from "./keymap";

export interface ControlScheme {
  animate(): void;

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
    // control inspectedCell on click
    if (event.target === this.mito.canvas) {
      if (this.mito.isPaused) {
        if (event.button === 0) {
          this.mito.pausedInspectedTile = this.mito.getTileAtScreen();
        } else if (event.button === 2) {
          this.mito.pausedInspectedTile = undefined;
        }
        return;
      }
      if (this.mito.inspectedCell != null) {
        this.mito.inspectedCell = undefined;
        return;
      }
      if (event.button === 0) {
        this.leftClick();
      } else if (event.button === 2) {
        this.rightClick();
      }
    }
  };

  animate() {
    const { mito } = this;
    // keyboard actions
    const moveAction = this.keysToMovement(Keyboard.keyMap);
    if (moveAction) {
      mito.world.player.setAction(moveAction);
    }
    for (const key of Keyboard.keyMap) {
      if (ACTION_CONTINUOUS_KEYMAP[key]) {
        mito.world.player.setAction(ACTION_CONTINUOUS_KEYMAP[key]);
      }
    }

    // mouse actions
    switch (this.mito.mouse.button) {
      case 0:
        this.leftClickHold();
        break;
    }
  }

  handleKeyDown = (event: KeyboardEvent) => {
    const { mito } = this;
    const code = event.code;
    if (!event.repeat) {
      if (code === "Space") {
        mito.isPaused = !mito.isPaused;
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

  public leftClick() {
    // no-op for left-clicking
    const { mito } = this;
    const target = mito.highlightedTile;
    if (target == null) {
      return;
    }
    const action = mito.toolBar.leftClick(target);
    if (action != null && !isContinuous(action)) {
      mito.world.player.setAction(action);
    }
  }

  public rightClick() {
    const tile = this.mito.highlightedTile;
    if (tile == null) {
      return;
    }
    if (tile instanceof Cell) {
      // HACK stop movement
      Keyboard.keyMap.delete("KeyW");
      Keyboard.keyMap.delete("KeyS");
      Keyboard.keyMap.delete("KeyA");
      Keyboard.keyMap.delete("KeyD");
      this.mito.inspectedCell = tile;
    }
  }

  public leftClickHold() {
    const { mito } = this;
    const target = mito.highlightedTile;
    if (target == null) {
      return;
    }
    const action = mito.toolBar.leftClick(target);
    if (action != null && isContinuous(action)) {
      mito.world.player.setAction(action);
    }
  }

  public wouldLeftClickInteract() {
    const { mito } = this;
    const tile = mito.highlightedTile;
    // return tile != null && mito.actionBar.leftClick(tile)?.type === "interact";
    const type = tile && mito.toolBar.leftClick(tile)?.type;
    return type === "pickup" || type === "drop";
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

  animate(): void {
    if (this.mito.mouse.button === 0) {
      this.handleLeftClick();
    }
  }

  public popOut() {
    if (this.mito.world.playerSeed && this.mito.world.time > 3) {
      this.mito.world.playerSeed!.popOut();
      this.mito.controls = new PlayerControlScheme(this.mito);
    }
  }

  public handleLeftClick(): void {
    if (this.mito.highlightedPosition) {
      const clickedPos = this.mito.highlightedPosition.round();
      if (this.mito.world.playerSeed!.pos.distanceTo(clickedPos) < 0.5) {
        this.popOut();
      }
    }
  }

  public wouldLeftClickInteract() {
    return false;
  }
}
