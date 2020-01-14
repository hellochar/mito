import { Vector2 } from "three";
import { Interactable } from "../interactable";
import { World } from "../world";
import { Cell, CellArgs } from "./cell";
import Chromosome from "./chromosome";
import { GeneInventory, GeneLiving, GeneSoilAbsorption } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";
import { CellType } from "./genome";

export const chromosomeRoot = new Chromosome(
  GeneLiving.level(2),
  GeneInventory.level(4),
  GeneObstacle.level(0),
  GeneSoilAbsorption.level(2)
);

export class Root extends Cell implements Interactable {
  static displayName = "Root";
  constructor(pos: Vector2, world: World, args?: CellArgs) {
    super(pos, world, cellTypeRoot, args);
  }
}

export const cellTypeRoot: CellType = {
  name: "Root",
  chromosome: chromosomeRoot,
  geneSlots: 10,
  c: Root,
  interaction: {
    type: "take",
    resources: "water and sugar",
  },
};
