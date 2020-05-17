import { nf } from "common/formatters";
import MP from "game/ui/common/MP";
import { clamp } from "math";
import React from "react";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/gene";
import { GeneInstance } from "../../core/cell/geneInstance";

export interface ReproducerState {
  timeMatured?: number;
  isMature: boolean;
  energyRecieved: number;
}

export const GeneFruit = Gene.make<ReproducerState>(
  {
    name: "Fruit",
    levelCosts: [10, 15, 20, 25, 30],
    levelProps: {
      mpEarned: [3, 4, 5, 6, 7],
      neededEnergy: 500,
    },
    static: {
      isReproductive: true,
      // TODO fix this to be a "set to 0"
      timeToBuild: -1,
    },
    description: reproducerDescription,
  },
  () => ({
    isMature: false,
    energyRecieved: 0,
  }),
  (dt, instance) => {
    reproducerStep(dt, instance);
  }
);

export type GeneFruit = typeof GeneFruit;

export const GeneSeed = Gene.make<ReproducerState>(
  {
    name: "Seed",
    levelCosts: [3, 4, 5, 6, 8],
    levelProps: {
      mpEarned: [1, 1.25, 1.5, 1.75, 2],
      neededEnergy: 250,
    },
    static: {
      isReproductive: true,
      timeToBuild: -1,
    },
    description: reproducerDescription,
  },
  () => ({
    isMature: false,
    energyRecieved: 0,
  }),
  (dt, instance) => {
    reproducerStep(dt, instance);
  }
);

export type GeneSeed = typeof GeneSeed;

const ENERGY_TRANSFER_PER_SECOND = 0.25;
const NEIGHBOR_ENERGY_THRESHOLD = 0.5;

function reproducerDescription({ mpEarned, neededEnergy }: Record<string, number>) {
  return (
    <>
      <p>Absorbs {neededEnergy} energy from neighbors to mature.</p>
      <p>
        Each neighboring Cell contributes 1 energy every <b>{nf(1 / ENERGY_TRANSFER_PER_SECOND, 1)}</b> seconds.
      </p>
      <p>
        On maturation,{" "}
        <b>
          achieve <span className="reproduction">Survival</span>
        </b>{" "}
        and earn <MP amount={mpEarned} />.
      </p>
    </>
  );
}

function reproducerStep(dt: number, instance: GeneInstance<Gene<ReproducerState, string>>) {
  const {
    cell,
    state,
    props: { mpEarned, neededEnergy },
  } = instance;
  const { isMature } = state;
  if (!isMature) {
    commitEnergy(dt, cell, state, neededEnergy);
    const isNowMature = reproducerGetPercentMatured(instance) >= 1;
    if (isNowMature) {
      state.isMature = isNowMature;
      state.timeMatured = cell.world.time;
      instance.earnMP(cell, mpEarned);
    }
    // give energy to the cell itself if it's going to die
    if (cell.energy < 0.5) {
      const energyToGive = clamp(clamp(0.5 - cell.energy, 0, ENERGY_TRANSFER_PER_SECOND * dt), 0, state.energyRecieved);
      state.energyRecieved -= energyToGive;
      cell.energy += energyToGive;
    }
  }
}

function commitEnergy(dt: number, seed: Cell, state: ReproducerState, neededEnergy: number) {
  let energyLeftToTake = neededEnergy - state.energyRecieved;
  let energyRecieved = 0;
  const tileNeighbors = seed.world.tileNeighbors(seed.pos);
  for (const neighbor of tileNeighbors.values()) {
    if (!Cell.is(neighbor)) continue;

    if (neighbor.energy > NEIGHBOR_ENERGY_THRESHOLD && energyLeftToTake > 0 && !neighbor.isReproductive) {
      const energyToTake = clamp(neighbor.energy, 0, ENERGY_TRANSFER_PER_SECOND * dt);
      state.energyRecieved += energyToTake;
      neighbor.energy -= energyToTake;

      energyLeftToTake -= energyToTake;
      energyRecieved += energyToTake;

      seed.world.logEvent({ type: "cell-transfer-energy", from: neighbor, to: seed, amount: energyToTake });
    }
  }

  if (energyRecieved > 0) {
    seed.world.logEvent({
      type: "grow-fruit",
      cell: seed,
      resourcesUsed: energyRecieved * 20,
    });
  }
}

export function reproducerGetPercentMatured(g: GeneInstance<Gene<ReproducerState, any>>) {
  const { energyRecieved } = g.state;
  const neededEnergy = g.props.neededEnergy;
  return energyRecieved / (neededEnergy - 1e-12);
}
