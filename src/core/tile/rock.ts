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

  get cellAirDistanceContrib() {
    return 1000;
  }

  shouldStep(dt: number) {
    return dt > 0.3;
  }
}
