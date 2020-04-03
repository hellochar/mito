import { DIRECTIONS, Directions } from "core/directions";
import { ResourceIcon } from "game/ui/common/ResourceIcon";
import React from "react";
import { Gene } from "../../core/cell/gene";

export const GenePipes = Gene.make(
  {
    name: "Pipes",
    levelCosts: [1, 2, 3, 5, 8],
    levelProps: {
      diffusionRate: [0.025, 0.05, 0.1, 0.2, 0.4],
    },
    description: ({ diffusionRate }) => (
      <>
        <b>Hold Shift to configure.</b>
        <p>
          Continuously equalize <ResourceIcon name="water" />
          <ResourceIcon name="sugar" /> between nearby cells. Get <b>{diffusionRate * 100}%</b> closer every second.
        </p>
      </>
    ),
  },
  () => ({
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
          cell.diffuseSugar(neighbor, dt, diffusionRate);
          neighbor.diffuseSugar(cell, dt, diffusionRate);
        }
      }
    }
  }
);
export type GenePipes = typeof GenePipes;

export type PipesConnections = Partial<Record<Directions, boolean>>;
