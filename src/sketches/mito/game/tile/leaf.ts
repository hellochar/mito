import { Vector2 } from "three";
import { traitMod } from "../../../../evolution/traits";
import { Inventory } from "../../inventory";
import { LEAF_REACTION_TIME } from "../constants";
import { Air } from "./air";
import { Cell } from "./cell";
import { Tissue } from "./tissue";
export class Leaf extends Cell {
  static displayName = "Leaf";
  public isObstacle = true;
  public averageEfficiency = 0;
  public averageSpeed = 0;
  public sugarConverted = 0;
  public tilePairs: Vector2[] = []; // implied that the opposite direction is connected
  public totalSugarProduced = 0;
  public inventory = new Inventory(0, this);
  reactionRate() {
    return (1 / traitMod(this.world.traits.photosynthesis, LEAF_REACTION_TIME, 1 / 1.5)) * this.tempo;
  }
  public step(dt: number) {
    super.step(dt);
    const neighbors = this.world.tileNeighbors(this.pos);
    this.averageEfficiency = 0;
    this.averageSpeed = 0;
    this.sugarConverted = 0;
    let numAir = 0;
    this.tilePairs = [];
    for (const [dir, tile] of neighbors) {
      const oppositeTile = this.world.tileAt(this.pos.x - dir.x, this.pos.y - dir.y);
      if (tile instanceof Air && oppositeTile instanceof Tissue) {
        numAir += 1;
        this.tilePairs.push(dir);
        const air = tile;
        const tissue = oppositeTile;
        // do the reaction slower in dark places
        const speed = air.sunlight();
        // gives much less sugar lower down
        const efficiency = air.co2();
        this.averageEfficiency += efficiency;
        this.averageSpeed += speed;
        const reactionRate = this.reactionRate();
        // in prime conditions:
        //      our rate of conversion is speed * params.leafReactionRate
        //      we get 1 sugar at 1/efficiencyRatio (> 1) water
        // if we have less than 1/efficiencyRatio water
        //      our rate of conversion scales down proportionally
        //      on conversion, we use up all the available water and get the corresponding amount of sugar
        const bestEfficiencyWater = 1 / efficiency;
        const waterToConvert = Math.min(tissue.inventory.water, bestEfficiencyWater);
        // water (1 / time) * time / (water)
        const chance = (speed * reactionRate * dt) / bestEfficiencyWater;
        // console.log(chance);
        if (Math.random() < chance) {
          const sugarConverted = waterToConvert * efficiency;
          tissue.inventory.add(-waterToConvert, sugarConverted);
          this.sugarConverted += sugarConverted;
          this.totalSugarProduced += sugarConverted;
          if (sugarConverted > 0.1) {
            this.world.logEvent({
              type: "photosynthesis",
              leaf: this,
              where: tissue,
            });
          }
        }
      }
    }
    if (numAir > 0) {
      this.averageEfficiency /= numAir;
      // this.averageSpeed /= numAir;
    }
  }
}
