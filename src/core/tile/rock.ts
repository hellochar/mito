import { Inventory } from "../inventory";
import { Tile } from "./tile";
export class Rock extends Tile {
  displayName = "Rock";

  isObstacle = true;

  isStructuralSupport = true;

  inventory = new Inventory(0, this);

  get darknessContrib() {
    return 1;
  }

  get cellDistanceContrib() {
    return Infinity;
  }

  shouldStep(dt: number) {
    return dt > 0.3;
  }
}
