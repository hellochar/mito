import { Cell } from "./tile";
export type TileEvent = EventCellTransferEnergy | EventCellEat;
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
