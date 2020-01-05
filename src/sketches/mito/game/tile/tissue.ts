import { Vector2 } from "three";
import { traitMod } from "../../../../evolution/traits";
import { Inventory } from "../../inventory";
import { TISSUE_INVENTORY_CAPACITY } from "../constants";
import { World } from "../world";
import { Cell } from "./cell";
import Genome from "./genome";

const genomeTissue = new Genome();

export class Tissue extends Cell {
  static displayName = "Tissue";
  public inventory: Inventory;
  constructor(pos: Vector2, world: World) {
    super(pos, world, genomeTissue);
    this.inventory = new Inventory(
      Math.floor(traitMod(world.traits.carryCapacity, TISSUE_INVENTORY_CAPACITY, 1.5)),
      this
    );
  }
}
