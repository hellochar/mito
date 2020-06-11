import { maxBy, minBy } from "lodash";
import { Insect } from "./insect";
import { Action } from "./player/action";
import { Air, Cell } from "./tile";

export class Locust extends Insect {
  public findNextAction(): Action | undefined {
    // if we don't have food, find a Cell and eat it
    // const thisDist = this.currentTile().closestCellDistance;
    const neighbors = this.world
      .tileNeighbors(this.pos)
      .array.filter((t) => t.pos.manhattanDistanceTo(this.pos) < 2 && (Air.is(t) || Cell.is(t)));
    if (this.inventory.sugar < 1) {
      const target = minBy(neighbors, (tile) => tile.closestCellAirDistance);
      if (Air.is(target)) {
        return {
          type: "move",
          dir: target.pos
            .clone()
            .sub(this.posFloat)
            .normalize(),
        };
      } else if (Cell.is(target)) {
        return {
          type: "deconstruct",
          position: target.pos,
          force: true,
        };
        // this.setAction({
        //   type: "long",
        //   duration: 3,
        //   effect: {
        //     type: "deconstruct",
        //     position: target.pos,
        //     force: true,
        //   },
        //   elapsed: 0,
        // });
      }
    } else {
      // insect is full; run away
      const target = maxBy(neighbors, (tile) => tile.closestCellAirDistance);
      if (this.world.isAtEdge(this.pos)) {
        this.world.removeInsect(this);
      }
      if (target != null) {
        return {
          type: "move",
          dir: target.pos
            .clone()
            .sub(this.posFloat)
            .normalize(),
        };
      }
    }
  }
}
