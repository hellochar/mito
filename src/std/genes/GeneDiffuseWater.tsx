import { ResourceIcon } from "game/ui/common/ResourceIcon";
import React from "react";
import GN from "std/genes/GN";
import { Gene } from "../../core/cell/gene";

export const GeneDiffuseWater = Gene.make(
  {
    name: "Diffuse Water",
    levelCosts: [0, 0, 0, 0, 1],
    static: {
      diffusionWater: [0.1, 0.12, 0.14, 0.16, 0.25],
    },
    levelProps: {},
    description: (props, { diffusionWater }) => (
      <>
        <p>
          Continuously recieve <ResourceIcon name="water" /> from neighboring Cells with more.
        </p>
        <p>
          On average, get 1<ResourceIcon name="water" /> every <GN value={1 / diffusionWater!} sigFigs={3} /> seconds.
        </p>
      </>
    ),
  },
  {},
  () => {}
);
export type GeneDiffuseWater = typeof GeneDiffuseWater;
