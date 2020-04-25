import React from "react";
import GN from "std/genes/GN";
import { Gene } from "../../core/cell/gene";
import RI from "./RI";

export const GeneDiffuseSugar = Gene.make(
  {
    name: "Diffuse Sugar",
    levelCosts: [0, 0, 0, 0, 1],
    static: {
      diffusionSugar: [0.1, 0.12, 0.14, 0.16, 0.25],
    },
    levelProps: {},
    description: (props, { diffusionSugar }) => (
      <>
        <p>
          Continuously recieve <RI s /> from neighboring Cells with more.
        </p>
        <p>
          On average, get 1<RI s /> every <GN value={1 / diffusionSugar!} sigFigs={3} /> seconds.
        </p>
      </>
    ),
  },
  {},
  () => {}
);
export type GeneDiffuseSugar = typeof GeneDiffuseSugar;
