import { Vector2 } from "three";
import { Air, Cell, Tile } from ".";
export type TileEvent =
  | EventCellTransferEnergy
  | EventCellEat
  | EventEvaporation
  | EventPhotosynthesis
  | EventThawIce
  | EventCollectSunlight
  | EventGrowFruit;

export type TileEventType = TileEvent["type"];

export interface EventEvaporation {
  type: "evaporation";
  tile: Tile;
}
export interface EventCellTransferEnergy {
  type: "cell-transfer-energy";
  from: Cell;
  to: Cell;
  /**
   * Max is probably 0.5, min 0.01
   */
  amount: number;
}
export interface EventCellEat {
  type: "cell-eat";
  who: Cell;
}

export interface EventPhotosynthesis {
  type: "photosynthesis";
  cell: Cell;
  amount: number;
}

export interface EventThawIce {
  type: "thaw";
  where: Tile;
}

export interface EventCollectSunlight {
  type: "collect-sunlight";
  leaf: Cell;
  air: Air;
  point?: Vector2;
  numSunlight: number;
}

export interface EventGrowFruit {
  type: "grow-fruit";
  cell: Cell;
  resourcesUsed: number;
}
