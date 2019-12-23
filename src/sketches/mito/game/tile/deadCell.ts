import { Inventory } from "../../inventory";
import { Tile } from "./tile";
export class DeadCell extends Tile {
  static displayName = "Dead Cell";
  inventory = new Inventory(0, this);
  shouldStep(dt: number) {
    return dt > 0.3;
  }
}
