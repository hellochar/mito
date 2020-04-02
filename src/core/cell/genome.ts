import { createSimpleSchema, list, object, serializable } from "serializr";
import { Vector2 } from "three";
import { CellArgs } from "./cell";
import Chromosome from "./chromosome";
import { MaterialInfo, MaterialInfoSchema } from "./materialInfo";
import { RealizedGene } from "./realizedGene";

export interface CellInteraction {
  type: "give" | "take";
  resources: "water" | "sugar" | "water and sugar" | "water take sugar" | "sugar take water";
}

const interactSpeedMap: Record<string, InteractSpeed> = {
  "give water": "instant",
  "give sugar": "instant", // mostly for Tissue
  "give water and sugar": "continuous", // mostly for Seed
  "give water take sugar": "continuous", // mostly for Leaf
  "give sugar take water": "instant",
  "take water": "continuous",
  "take sugar": "continuous",
  "take water and sugar": "continuous", // mostly for Root
};

export type InteractSpeed = "instant" | "continuous";

export function interactionSpeed(interaction: CellInteraction): InteractSpeed {
  const { resources, type } = interaction;
  const name = `${type} ${resources}`;
  return interactSpeedMap[name] ?? "instant";
}

const CellInteractionSchema = createSimpleSchema({
  "*": true,
});

export class CellType {
  @serializable
  public name: string;

  @serializable
  public geneSlots: number;

  @serializable(object(Chromosome))
  public chromosome: Chromosome;

  @serializable(object(MaterialInfoSchema))
  public material: MaterialInfo;

  @serializable(object(CellInteractionSchema))
  public interaction?: CellInteraction;

  public args?: CellArgs;

  // all params optional because serializr might call this with 0 args
  constructor(
    name?: string,
    geneSlots?: number,
    chromosome?: Chromosome,
    material?: MaterialInfo,
    interaction?: CellInteraction
  ) {
    this.name = name!;
    this.geneSlots = geneSlots!;
    this.chromosome = chromosome!;
    this.material = material!;
    this.interaction = interaction;
    if (chromosome?.mergeStaticProperties().isDirectional) {
      this.args = {
        direction: new Vector2(0, -1),
      };
    }
  }

  rotateArgDirection() {
    const direction = this.args?.direction;
    direction
      ?.rotateAround(new Vector2(), -Math.PI / 4)
      .setLength(1)
      .round();
  }

  isReproducer() {
    return this.chromosome.genes.some((gene) => gene.getStaticProperties().isReproductive);
  }
}

export default class Genome {
  @serializable(list(object(CellType)))
  public cellTypes: CellType[];

  @serializable(list(object(RealizedGene)))
  public unusedGenes: RealizedGene[];

  constructor(cellTypes?: CellType[], unusedGenes?: RealizedGene[]) {
    this.cellTypes = cellTypes!;
    this.unusedGenes = unusedGenes!;
  }
}

export function describeCellInteraction({ resources, type }: CellInteraction) {
  return `${type} ${resources}`;
}
