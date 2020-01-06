import { randRound } from "math";
import { Vector2 } from "three";
import { traitMod } from "../../../../evolution/traits";
import { canPullResources } from "../canPullResources";
import { LEAF_REACTION_TIME, LEAF_WATER_INTAKE_PER_SECOND } from "../constants";
import { World } from "../world";
import { Air } from "./air";
import { Cell } from "./cell";
import Chromosome from "./chromosome";
import { GeneInventory, GeneLiving } from "./genes";
import { GeneObstacle } from "./genes/GeneObstacle";

export const chromosomeLeaf = new Chromosome(GeneLiving.level(2), GeneInventory.level(2), GeneObstacle.level(0));

export class Leaf extends Cell {
  static displayName = "Leaf";
  public averageConversionRate = 0;
  public averageChancePerSecond = 0;
  public sugarConverted = 0;
  public activeNeighbors: Vector2[] = [];
  public totalSugarProduced = 0;

  constructor(pos: Vector2, world: World) {
    super(pos, world, chromosomeLeaf);
  }

  reactionRate() {
    return (1 / traitMod(this.world.traits.photosynthesis, LEAF_REACTION_TIME, 1 / 1.5)) * this.tempo;
  }

  public step(dt: number) {
    super.step(dt);
    this.averageConversionRate = 0;
    this.averageChancePerSecond = 0;
    this.sugarConverted = 0;
    const neighbors = this.world.tileNeighbors(this.pos);

    let numAir = 0;
    this.activeNeighbors = [];
    for (const [dir, tile] of neighbors) {
      // pull water from nearby sources
      if (tile instanceof Leaf) {
        tile.diffuseWater(this, dt, this.diffusionWater * 5);
      } else if (canPullResources(this, tile)) {
        tile.inventory.give(this.inventory, randRound(LEAF_WATER_INTAKE_PER_SECOND * dt), 0);
      } else if (tile instanceof Air) {
        this.activeNeighbors.push(dir);
        numAir += 1;
        this.maybePhotosynthesize(dt, tile, this);
      }
    }

    if (numAir > 0) {
      this.averageConversionRate /= numAir;
      // this.averageSpeed /= numAir;
    }
  }
  // public sunlightCollected = 0;

  public lastPhotosynthesisEvent = 0;

  maybePhotosynthesize(dt: number, air: Air, tissue: Cell) {
    // this.tilePairs.push(dir);
    // do the reaction slower in dark places
    const speed = air.sunlight();
    // gives much less sugar lower down
    const conversionRate = air.co2();
    // const conversionRate = 1;
    this.averageConversionRate += conversionRate;
    const reactionRate = this.reactionRate();
    // in prime conditions:
    //      our rate of conversion is speed * params.leafReactionRate
    //      we get 1 sugar at 1/efficiencyRatio (> 1) water
    // if we have less than 1/efficiencyRatio water
    //      our rate of conversion scales down proportionally
    //      on conversion, we use up all the available water and get the corresponding amount of sugar
    const bestEfficiencyWater = 1 / conversionRate;
    const waterToConvert = Math.min(tissue.inventory.water, bestEfficiencyWater);
    // water (1 / time) * time / (water)
    const chance = speed * reactionRate; // * (waterToConvert / bestEfficiencyWater);
    this.averageChancePerSecond += chance;

    // this.sunlightCollected += chance * dt;
    this.world.logEvent({
      type: "collect-sunlight",
      leaf: this,
      air,
      amount: speed,
      // amount: chance,
    });

    // chance = 1 = speed * reactionRate * dt / bestEfficiencyWater
    // dt = 40
    // reactionRate = 1 / 40
    // speed = 1 (perfect sunlight)
    // bestEfficiencyWater
    if (Math.random() < chance * dt && waterToConvert > 0) {
      // if (this.sunlightCollected > 1) {
      if (waterToConvert > 0) {
        const sugarConverted = waterToConvert * conversionRate;
        tissue.inventory.add(-waterToConvert, sugarConverted);
        this.sugarConverted += sugarConverted;
        this.totalSugarProduced += sugarConverted;
        this.world.logEvent({
          type: "photosynthesis",
          leaf: this,
          where: tissue,
          amount: sugarConverted,
        });
      }
      const elapsed = this.age - this.lastPhotosynthesisEvent;
      console.log("elapsed", elapsed.toFixed(2));
      this.lastPhotosynthesisEvent = this.age;
      // this.sunlightCollected -= 1;
    }
  }
}
