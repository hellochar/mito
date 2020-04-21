import { Cell } from "core/cell";
import React from "react";
import GN from "std/genes/GN";
import { Gene } from "../../core/cell/gene";
import RI from "./RI";

const extraDiffusion = 0.1;

export const GeneAdhesion = Gene.make(
  {
    name: "Adhesion",
    levelCosts: [2],
    levelProps: {},
    dynamic(cell, properties) {
      const neighbors = cell.world.tileNeighbors(cell.pos);
      let nonCellNeighbors = 0;
      for (const [, t] of neighbors) {
        if (!(t instanceof Cell)) {
          nonCellNeighbors++;
        }
      }
      if (nonCellNeighbors >= 3) {
        properties.diffusionWater += extraDiffusion;
      }
      return properties;
    },
    description: () => (
      <>
        <p>
          While this cell has 3 or more non-Cell neighbors, diffuse <RI w /> into this cell.
        </p>
        <p>
          On average, get 1<RI w /> every <GN value={1 / extraDiffusion} sigFigs={3} /> seconds.
        </p>
      </>
    ),
  },
  {},
  () => {}
);

export type GeneAdhesion = typeof GeneAdhesion;