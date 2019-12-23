import { Inventory } from "../../inventory";
import { Tissue } from "./tissue";
export class Vein extends Tissue {
  static displayName = "Vein";
  static diffusionWater = 0.5;
  static diffusionSugar = 0.5;
  public inventory = new Inventory(8, this);
}
