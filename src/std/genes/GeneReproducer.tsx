import { Inventory } from "core/inventory";
import MP from "game/ui/common/MP";
import { ResourceIcon } from "game/ui/common/ResourceIcon";
import { clamp } from "math";
import React from "react";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/gene";
import { GeneInstance } from "../../core/cell/geneInstance";
import { TIME_PER_DAY, TIME_PER_MONTH } from "../../core/constants";

export interface ReproducerState {
  timeMatured?: number;
  isMature: boolean;
  committedResources: Inventory;
}

export const GeneFruit = Gene.make<ReproducerState>(
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
    description: reproducerDescription,
  },
  (gene, props, cell) => ({
    isMature: false,
    committedResources: new Inventory(props.neededResources, cell),
  }),
  (dt, instance) => {
    reproducerStep(dt, instance);
  }
);

export type GeneFruit = typeof GeneFruit;

export const GeneSeed = Gene.make<ReproducerState>(
  {
    name: "Seed",
    levelCosts: [6, 8, 10, 12, 14],
    levelProps: {
      mpEarned: [0.5, 0.75, 1, 1.25, 1.5],
      neededResources: 200,
      secondsToMature: TIME_PER_DAY / 2,
    },
    static: {
      isReproductive: true,
      timeToBuild: -1,
    },
    description: reproducerDescription,
  },
  (gene, props, cell) => ({
    isMature: false,
    committedResources: new Inventory(props.neededResources, cell),
  }),
  (dt, instance) => {
    reproducerStep(dt, instance);
  }
);

export type GeneSeed = typeof GeneSeed;

function reproducerDescription({ mpEarned, neededResources, secondsToMature }: Record<string, number>) {
  return (
    <>
      <p>Reproducer.</p>
      <p>
        Consumes {neededResources / 2}
        <ResourceIcon name="water" /> and {neededResources / 2}
        <ResourceIcon name="sugar" /> on this Cell to reach Maturity.{" "}
      </p>
      <p>
        On Maturity,{" "}
        <b>
          achieve <span className="reproduction">Survival</span>
        </b>{" "}
        and earn <MP amount={mpEarned} />.
      </p>
      <p>With constant feeding, matures in {secondsToMature} seconds.</p>
    </>
  );
}

function reproducerStep(dt: number, instance: GeneInstance<Gene<ReproducerState, string>>) {
  const {
    cell,
    state,
    props: { mpEarned, neededResources, secondsToMature },
  } = instance;
  const { committedResources, isMature } = state;
  if (!isMature) {
    commitResources(dt, cell, committedResources, neededResources, secondsToMature);
    repelUnneededResources(dt, cell, committedResources, neededResources, secondsToMature);
    const isNowMature = reproducerGetPercentMatured(instance) === 1;
    if (isNowMature) {
      state.isMature = isNowMature;
      state.timeMatured = cell.world.time;
      instance.earnMP(cell, mpEarned);
    }
  }
}

function commitResources(
  dt: number,
  cell: Cell,
  committed: Inventory,
  neededResources: number,
  secondsToMature: number
) {
  const oneSecondCommitMax = neededResources / secondsToMature;
  const wantedWater = clamp(neededResources / 2 - committed.water, 0, oneSecondCommitMax * dt);
  const wantedSugar = clamp(neededResources / 2 - committed.sugar, 0, oneSecondCommitMax * dt);
  const { water, sugar } = cell.inventory.give(committed, wantedWater, wantedSugar);
  if (water + sugar > 0) {
    cell.world.logEvent({
      type: "grow-fruit",
      cell,
      resourcesUsed: water + sugar,
    });
  }
}

function repelUnneededResources(
  dt: number,
  cell: Cell,
  committed: Inventory,
  neededResources: number,
  secondsToMature: number
) {
  const oneSecondRepelMax = neededResources / secondsToMature;
  // if there's more water than needed in the cell's inventory, push it to neighbors
  const hasTooMuchWater = cell.inventory.water > 0 && committed.water >= neededResources / 2;
  const hasTooMuchSugar = cell.inventory.sugar > 0 && committed.sugar >= neededResources / 2;

  const waterToRepel = hasTooMuchWater ? clamp(cell.inventory.water, 0, oneSecondRepelMax * dt) : 0;
  const sugarToRepel = hasTooMuchSugar ? clamp(cell.inventory.sugar, 0, oneSecondRepelMax * dt) : 0;

  if (waterToRepel > 0 || sugarToRepel > 0) {
    cell.redistributeInventoryToNeighbors(waterToRepel, sugarToRepel);
  }
}

export function reproducerGetPercentMatured(g: GeneInstance<Gene<ReproducerState, any>>) {
  const r = g.state.committedResources;
  // add 1 buffer for fp errors
  return clamp((r.sugar + r.water) / (r.capacity - 1), 0, 1);
}
