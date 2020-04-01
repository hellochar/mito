import { Inventory } from "../inventory";
import { Tile } from "./tile";

export class DeadCell extends Tile {
  displayName = "Dead Cell";

  isObstacle = false;

  inventory = new Inventory(0, this);

  shouldStep(dt: number) {
    return dt > 0.3;
  }
}
