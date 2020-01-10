import React from "react";
import GN from "sketches/mito/ui/GN";
import { Cell } from "../cell";
import { Gene } from "../chromosome";

export const GeneDirectionalPush = Gene.make(
  {
    name: "⬆ Directional Push",
    levelCosts: [2, 3, 4, 5, 6],
    levelProps: {
      secondsPerPush: [20, 10, 5, 3, 2],
    },
    description: ({ secondsPerPush }) => (
      <>
        <b>Directional.</b>
        <br />
        Every <GN value={secondsPerPush} sigFigs={2} /> seconds, directionally push 1 Water and 1 Sugar from this Cell
        into the directed Cell.
      </>
    ),
    static: {
      isDirectional: true,
    },
  },
  {
    didJustTransport: false,
    cooldown: 0,
  },
  (dt, { cell, state, props: { secondsPerPush } }) => {
    state.didJustTransport = false;
    if (state.cooldown <= 0) {
      state.cooldown += secondsPerPush;
      const targetTile = cell.world.tileAt(cell.pos.x + cell.args!.direction!.x, cell.pos.y + cell.args!.direction!.y);
      if (targetTile instanceof Cell) {
        state.didJustTransport = push(cell, targetTile, 1, 1);
      }
    }
    state.cooldown -= cell.tempo * dt;
  }
);
export type GeneDirectionalPush = typeof GeneDirectionalPush;

function push(cell: Cell, target: Cell, waterToTransport: number, sugarToTransport: number) {
  const { water, sugar } = cell.inventory.give(target.inventory, waterToTransport, sugarToTransport);
  return water > 0 || sugar > 0;
}
