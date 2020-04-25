import { ResourceIcon } from "game/ui/common/ResourceIcon";
import { randFloat } from "math";
import React from "react";
import GN from "std/genes/GN";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/gene";

export const GeneTransport = Gene.make(
  {
    name: "Transport",
    levelCosts: [1, 1, 1, 2, 3],
    levelProps: {
      secondsPerPush: [5, 4, 3, 2, 1],
    },
    description: ({ secondsPerPush }) => (
      <>
        <b>Hold Shift to configure.</b>
        <p>
          Every <GN value={secondsPerPush} sigFigs={2} /> seconds, move 1<ResourceIcon name="water" />1
          <ResourceIcon name="sugar" /> into the directed cell from behind.
        </p>
      </>
    ),
    static: {
      isDirectional: true,
      energyUpkeep: 1 / 720,
    },
  },
  (gene, { secondsPerPush }) => ({
    didJustTransport: false,
    cooldown: randFloat(0, secondsPerPush),
  }),
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
export type GeneTransport = typeof GeneTransport;

function push(cell: Cell, target: Cell, waterToTransport: number, sugarToTransport: number) {
  const { water, sugar } = cell.inventory.give(target.inventory, waterToTransport, sugarToTransport);
  return water > 0 || sugar > 0;
}
