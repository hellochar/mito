import { Inventory } from "../../../../core/inventory";
import { Tile } from "../../../../core/tile/tile";
export class Rock extends Tile {
  displayName = "Rock";

  isObstacle = true;

  inventory = new Inventory(0, this);

  get darknessContrib() {
    return 1;
  }

  shouldStep(dt: number) {
    return dt > 0.3;
  }
}
