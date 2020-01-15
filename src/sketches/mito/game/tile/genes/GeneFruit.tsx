import MP from "common/MP";
import { clamp } from "math";
import React from "react";
import { Inventory } from "sketches/mito/inventory";
import { TIME_PER_MONTH } from "../../constants";
import { Cell } from "../cell";
import { Gene, GeneInstance } from "../chromosome";

export interface FruitState {
  timeMatured?: number;
  isMature: boolean;
  committedResources: Inventory;
}

export const GeneFruit = Gene.make<FruitState>(
  {
    name: "Fruit",
    levelCosts: [10, 15, 20, 25, 30],
    levelProps: {
      mpEarned: [3, 4, 5, 6, 7],
      neededResources: 500,
      secondsToMature: 2 * TIME_PER_MONTH,
    },
    static: {
      isReproductive: true,
      // TODO fix this to be a "set to 0"
      timeToBuild: -1,
    },
    description: ({ mpEarned, neededResources, secondsToMature }) => (
      <>
        <p>
          Consumes {neededResources / 2} Water and {neededResources / 2} Sugar on this Cell to reach Maturity.{" "}
        </p>
        <p>
          On Maturity,{" "}
          <b>
            achieve <span className="reproduction">Reproduction</span>
          </b>{" "}
          and earn <MP amount={mpEarned} />.
        </p>
        <p>With constant feeding, Fruit can mature in {secondsToMature} seconds.</p>
      </>
    ),
  },
  (gene, props, cell) => ({
    isMature: false,
    committedResources: new Inventory(props.neededResources, cell),
  }),
  (dt, instance) => {
    const {
      cell,
      state,
      props: { mpEarned, neededResources, secondsToMature },
    } = instance;
    const { committedResources, isMature } = state;
    if (!isMature) {
      commitResources(dt * cell.tempo, cell, committedResources, neededResources, secondsToMature);
      const isNowMature = fruitGetPercentMatured(instance) === 1;
      if (isNowMature) {
        state.isMature = isNowMature;
        state.timeMatured = cell.world.time;
        instance.earnMP(cell, mpEarned);
      }
    }
  }
);

export type GeneFruit = typeof GeneFruit;

/**
 * Return whether the fruit is now mature.
 */
function commitResources(
  dt: number,
  cell: Cell,
  inventory: Inventory,
  neededResources: number,
  secondsToMature: number
) {
  const oneSecondCommitMax = neededResources / secondsToMature;
  const wantedWater = clamp(neededResources / 2 - inventory.water, 0, oneSecondCommitMax * dt);
  const wantedSugar = clamp(neededResources / 2 - inventory.sugar, 0, oneSecondCommitMax * dt);
  const { water, sugar } = cell.inventory.give(inventory, wantedWater, wantedSugar);
  if (water + sugar > 0) {
    cell.world.logEvent({
      type: "grow-fruit",
      cell,
      resourcesUsed: water + sugar,
    });
  }
}

export function fruitGetPercentMatured(g: GeneInstance<GeneFruit>) {
  const r = g.state.committedResources;
  // add 1 buffer for fp errors
  return clamp((r.sugar + r.water) / (r.capacity - 1), 0, 1);
}
