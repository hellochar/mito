import React from "react";
import GN from "std/genes/GN";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/gene";

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
        Every <GN value={secondsPerPush} sigFigs={2} /> seconds, directionally pull 1 Water and 1 Sugar from behind into
        this Cell, and also push 1 Water and 1 Sugar into the directed Cell.
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
      const forwardTile = cell.world.tileAt(cell.pos.x + cell.args!.direction!.x, cell.pos.y + cell.args!.direction!.y);
      if (forwardTile instanceof Cell) {
        state.didJustTransport = push(cell, forwardTile, 1, 1);
      }

      const backwardTile = cell.world.tileAt(
        cell.pos.x - cell.args!.direction!.x,
        cell.pos.y - cell.args!.direction!.y
      );
      if (backwardTile instanceof Cell) {
        state.didJustTransport = state.didJustTransport || push(backwardTile, cell, 1, 1);
      }
    }
    state.cooldown -= dt;
  }
);
export type GeneDirectionalPush = typeof GeneDirectionalPush;

function push(cell: Cell, target: Cell, waterToTransport: number, sugarToTransport: number) {
  const { water, sugar } = cell.inventory.give(target.inventory, waterToTransport, sugarToTransport);
  return water > 0 || sugar > 0;
}