import { Inventory } from "core/inventory";
import { Tile } from "core/tile/tile";
export class BarrenLand extends Tile {
  displayName = "Barren Land";

  public isObstacle = false;

  public isStructuralSupport = true;

  shouldStep(dt: number): boolean {
    return dt > 0.2;
  }

  public inventory = new Inventory(1, this);
}
