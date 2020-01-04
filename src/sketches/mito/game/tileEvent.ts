import { Air, Cell, Leaf, Tile } from "./tile";
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
  amount: number;
}
export interface EventCellEat {
  type: "cell-eat";
  who: Cell;
}

export interface EventPhotosynthesis {
  type: "photosynthesis";
  leaf: Leaf;
  where: Cell;
  amount: number;
}

export interface EventThawIce {
  type: "thaw";
  where: Tile;
}

export interface EventCollectSunlight {
  type: "collect-sunlight";
  leaf: Leaf;
  air: Air;
  amount: number;
}
