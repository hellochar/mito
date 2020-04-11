import { CellType } from "core/cell";
import { CellArgs } from "../../core/cell/cell";
import { isInteractable } from "../../core/interactable";
import { Action, ActionBuild } from "../../core/player/action";
import { Tile } from "../../core/tile";
import Mito from "../mito/mito";

export class ToolBar {
  static DIGIT_KEYS = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8"];

  tools: Record<string, Tool> = {
    KeyQ: TOOL_INTERACT,
  };

  public currentKey: string = "KeyQ";

  constructor(public mito: Mito) {
    const validCellTypes = mito.world.genome.cellTypes.filter((c) => c.getDuplicateGenes().size === 0);
    for (const index in validCellTypes) {
      const cellType = validCellTypes[index];
      if (cellType.getDuplicateGenes().size === 0) {
        const digitKey = ToolBar.DIGIT_KEYS[index];
        this.tools[digitKey] = makeToolToBuildCellType(cellType);
      }
    }
  }

  isInteract() {
    return this.currentTool === TOOL_INTERACT;
  }

  leftClick(target: Tile): Action | undefined {
    return this.currentTool.leftClick(target);
  }

  rightClick(target: Tile): Action | undefined {
    return this.currentTool.rightClick(target);
  }

  get currentTool() {
    return this.tools[this.currentKey];
  }

  setKey(key: string) {
    if (key in this.tools) {
      const lastKey = this.currentKey;

      // if you tap the same cellType twice, modify the args direction
      if (key === lastKey) {
        this.currentTool.nextConfiguration?.();
      }
      this.currentKey = key;
    }
  }

  keyDown(event: KeyboardEvent) {
    if (event.code === "Escape" && this.currentKey !== "KeyQ") {
      this.setKey("KeyQ");
    } else if (this.shouldCapture(event)) {
      this.setKey(event.code);
    }
  }

  shouldCapture(event: KeyboardEvent) {
    return !event.repeat && event.code in this.tools;
  }
}

export type Tool = ToolInteract | ToolBuild;

interface ToolBase {
  name: string;
  leftClick: (tile: Tile) => Action | undefined;
  rightClick: (tile: Tile) => Action | undefined;
  nextConfiguration?(): void;
}

export interface ToolInteract extends ToolBase {
  type: "interact";
}

export interface ToolBuild extends ToolBase {
  type: "build";
  cellType: CellType;
}

const TOOL_INTERACT: ToolInteract = {
  name: "Interact",
  type: "interact",
  leftClick: (target: Tile): Action | undefined => (isInteractable(target) ? target.interact(null!) : undefined),
  rightClick: (target: Tile): Action | undefined => ({
    type: "deconstruct",
    position: target.pos,
  }),
};

function makeToolToBuildCellType(cellType: CellType): ToolBuild {
  return {
    name: cellType.name,
    type: "build",
    cellType,
    leftClick(target: Tile) {
      let args: CellArgs | undefined;
      if (cellType.args) {
        args = { ...cellType.args };
      }

      const action: ActionBuild = {
        type: "build",
        cellType,
        position: target.pos.clone(),
        args,
      };
      return action;
    },
    rightClick(tile: Tile) {
      return undefined;
    },
    nextConfiguration() {
      cellType.rotateArgDirection();
    },
  };
}

// function maybeDeconstructAction(tile: Tile): ActionDeconstruct | undefined {
//   if (tile instanceof Cell && tile.isReproductive) {
//     return undefined; // disallow deleting reproductive cells
//   }
//   return {
//     type: "deconstruct",
//     position: tile.pos,
//   };
// }
