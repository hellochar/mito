import { Air, Cell, Tile } from "./tile";
export type TileEvent =
  | EventCellTransferEnergy
  | EventCellEat
  | EventEvaporation
  | EventPhotosynthesis
  | EventThawIce
  | EventCollectSunlight;

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
  amount: number;
}
