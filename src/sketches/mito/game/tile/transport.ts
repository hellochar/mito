import { Vector2 } from "three";
import { World } from "../world";
import { Cell, CellArgs } from "./cell";
import Chromosome from "./chromosome";
import { GeneEnergyTransfer, GeneInventory, GeneLiving } from "./genes";
import { GeneDirectionalPush } from "./genes/GeneDirectionalPush";
import { CellType } from "./genome";

export const chromosomeTransport = new Chromosome(
  GeneLiving.level(1),
  GeneInventory.level(3),
  GeneDirectionalPush.level(2),
  GeneEnergyTransfer.level(2)
);

export class Transport extends Cell {
  static buildDirection = new Vector2(0, -1);
  constructor(pos: Vector2, world: World, args?: CellArgs) {
    super(pos, world, cellTypeTransport, args);
  }
}

export const cellTypeTransport: CellType = {
  name: "Transport",
  chromosome: chromosomeTransport,
  geneSlots: 10,
  c: Transport,
  interaction: {
    type: "take",
    resources: "water and sugar",
  },
};
