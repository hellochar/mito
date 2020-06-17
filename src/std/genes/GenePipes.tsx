import { GeneInstance } from "core/cell";
import { DIRECTIONS, Directions, oppositeDir } from "core/directions";
import { Cell } from "core/tile";
import React from "react";
import { GenePhotosynthesis, GeneSoilAbsorption } from ".";
import { Gene } from "../../core/cell/gene";
import GN from "./GN";
import RI from "./RI";

export const GenePipes = Gene.make(
  {
    name: "Pipes",
    levelCosts: [1, 1, 1, 1, 1],
    levelProps: {
      diffusionRate: [5, 5, 5, 5, 5],
    },
    static: {
      energyUpkeep: 1 / 1500,
    },
    description: ({ diffusionRate }) => (
      <>
        <b>Hold Shift to configure.</b>
        <p>
          Continuously equalize <RI w /> between connected cells.
        </p>
        <p>
          On average, every <RI w /> will get equalized after <GN value={1 / diffusionRate} sigFigs={3} /> seconds.
        </p>
      </>
    ),
  },
  () => ({
    isEnabled: false,
    connections: {
      n: false,
      e: false,
      s: false,
      w: false,
    } as PipesConnections,
  }),
  (dt, { cell, props: { diffusionRate }, state: { connections } }) => {
    let directionName: Directions;
    for (directionName in connections) {
      if (connections[directionName]) {
        const direction = DIRECTIONS[directionName];
        const neighbor = cell.world.cellAt(cell.pos.x + direction.x, cell.pos.y + direction.y);
        if (neighbor) {
          cell.diffuseWater(neighbor, dt, diffusionRate);
          neighbor.diffuseWater(cell, dt, diffusionRate);

          // cell.diffuseSugar(neighbor, dt, diffusionRate);
          // neighbor.diffuseSugar(cell, dt, diffusionRate);
        }
      }
    }
  }
);
export type GenePipes = typeof GenePipes;

export type PipesConnections = Partial<Record<Directions, boolean>>;

function updatePipeConnection(gene: GeneInstance<GenePipes>, dir: Directions) {
  const { isEnabled, connections } = gene.state;
  const neighbor = gene.cell.world.tileNeighbors(gene.cell.pos).get(DIRECTIONS[dir]);
  if (!Cell.is(neighbor)) {
    return;
  }
  const isNeighborConsumerOrProducer =
    (neighbor.findGene(GenePhotosynthesis) || neighbor.findGene(GeneSoilAbsorption)) != null;
  const isNeighborAlsoPipeEnabled = !!neighbor.findGene(GenePipes)?.state.isEnabled;
  const shouldConnect = (isNeighborConsumerOrProducer || isNeighborAlsoPipeEnabled) && isEnabled;
  connections[dir] = shouldConnect;

  // also set neighbor's connecting pipe
  if (isNeighborAlsoPipeEnabled) {
    const neighborPipes = neighbor.findGene(GenePipes);
    if (neighborPipes != null) {
      neighborPipes.state.connections[oppositeDir(dir)] = isEnabled;
    }
  }
}

export function updatePipeConnections(gene: GeneInstance<GenePipes>) {
  updatePipeConnection(gene, "n");
  updatePipeConnection(gene, "s");
  updatePipeConnection(gene, "e");
  updatePipeConnection(gene, "w");
}
