import { Vector2 } from "three";
import { World } from "../world";
import { Cell, CellArgs } from "./cell";
import Chromosome from "./chromosome";
import { GeneAttractsWater, GeneInventory, GeneLiving } from "./genes";
import { GeneAttractsSugar } from "./genes/GeneAttractsSugar";
import { GeneCannotFreeze } from "./genes/GeneCannotFreeze";
import { GeneFruit } from "./genes/GeneFruit";
import { GeneObstacle } from "./genes/GeneObstacle";
import { CellType } from "./genome";

export const chromosomeFruit = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(0),
  GeneObstacle.level(0),
  GeneCannotFreeze.level(0),
  GeneFruit.level(0),
  GeneAttractsSugar.level(1),
  GeneAttractsWater.level(1)
);
export class Fruit extends Cell {
  constructor(pos: Vector2, world: World, args?: CellArgs) {
    super(pos, world, cellTypeFruit, args);
  }

  // step(dt: number) {
  // super.step(dt);
  // // how fast Fruit takes resources from surrounding tiles and puts it onto itself
  // // to be committed. Should be pretty fast.
  // const maxResourceIntake = 30 * dt * this.tempo;
  // const neighbors = this.world.tileNeighbors(this.pos);
  // for (const [, neighbor] of neighbors) {
  //   if (neighbor instanceof Cell && !(neighbor instanceof Fruit)) {
  //     const wantedWater = maxResourceIntake;
  //     const wantedSugar = maxResourceIntake;
  //     // aggressively take the inventory from neighbors
  //     neighbor.inventory.give(this.inventory, wantedWater, wantedSugar);
  //   }
  // }
  // }
}

export const cellTypeFruit: CellType = {
  name: "Fruit",
  chromosome: chromosomeFruit,
  geneSlots: 10,
  c: Fruit,
  interaction: {
    type: "give",
    resources: "water and sugar",
  },
};
