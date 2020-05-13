import { ResourceIcon } from "game/ui/common/ResourceIcon";
import React from "react";
import GN from "std/genes/GN";
import { Vector2 } from "three";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/gene";
import { Air } from "../../core/tile/air";

export interface PhotosynthesisState {
  totalSugarProduced: number;
  averageConversionRate: number;
  averageChancePerSecond: number;
  sugarConverted: number;
  activeNeighbors: Vector2[];
}

export const GenePhotosynthesis = Gene.make<PhotosynthesisState>(
  {
    name: "Photosynthesis",
    levelCosts: [4, 6, 8, 10, 12],
    levelProps: {
      reactionChancePerSecond: [0.05, 0.075, 0.1, 0.15, 0.2],
    },
    static: {
      energyUpkeep: 1 / 800,
    },
    description: ({ reactionChancePerSecond }) => (
      <>
        <p>
          Converts <ResourceIcon name="water" /> into <ResourceIcon name="sugar" />.
        </p>
        <p>50% co2, the trade is 2:1. At 100% co2, the trade is 1:1.</p>
        <p>
          Each neighboring Air provides a <GN value={reactionChancePerSecond * 100} sigFigs={3} />% chance per second,
          scaled with sunlight.
        </p>
      </>
    ),
  },
  {
    totalSugarProduced: 0,
    averageConversionRate: 0,
    averageChancePerSecond: 0,
    sugarConverted: 0,
    activeNeighbors: [],
  },
  (dt, { cell, state, props: { reactionChancePerSecond } }) => {
    state.averageConversionRate = 0;
    state.averageChancePerSecond = 0;
    state.sugarConverted = 0;
    state.activeNeighbors = [];

    const neighbors = cell.world.tileNeighbors(cell.pos);
    let numAir = 0;
    for (const [dir, tile] of neighbors) {
      if (Air.is(tile)) {
        state.activeNeighbors.push(dir);
        numAir += 1;
        maybePhotosynthesize(dt, tile, cell, reactionChancePerSecond, state);
      }
    }
    if (numAir > 0) {
      state.averageConversionRate /= numAir;
      // this.averageSpeed /= numAir;
    }
  }
);
export type GenePhotosynthesis = typeof GenePhotosynthesis;

function maybePhotosynthesize(
  dt: number,
  air: Air,
  cell: Cell,
  reactionChancePerSecond: number,
  state: PhotosynthesisState
) {
  const sunlight = air.sunlight();

  // gives much less sugar lower down
  const conversionRate = air.co2();

  state.averageConversionRate += conversionRate;
  // in prime conditions:
  //      our rate of conversion is speed * params.leafReactionRate
  //      we get 1 sugar at 1/efficiencyRatio (> 1) water
  // if we have less than 1/efficiencyRatio water
  //      our rate of conversion scales down proportionally
  //      on conversion, we use up all the available water and get the corresponding amount of sugar
  const bestEfficiencyWater = 1 / conversionRate;
  const waterToConvert = Math.min(cell.inventory.water, bestEfficiencyWater);

  const ambientChancePerSecond = reactionChancePerSecond * sunlight;
  // this.sunlightCollected += chance * dt;
  if (waterToConvert > 0 && ambientChancePerSecond > 0) {
    cell.world.logEvent({
      type: "collect-sunlight",
      leaf: cell,
      air,
      // the renderer creates one dot per sunlight unit.
      // 0.05 normalizes chancePerSecond (which is 0.075 for photosynthesis 3),
      // * 5 means photosynthesis 3 gets 5 dots per second per air (this is the new player experience)
      numSunlight: (ambientChancePerSecond / 0.05) * dt * 5,
    });
  }

  // let intersectionChancePerSecond = 0;
  // if (cell.world.occluderManager.getIntersection(cell) != null) {
  //   intersectionChancePerSecond = reactionChancePerSecond * sunlight * 5;
  //   const p = cell.lightIntersection.point;
  //   cell.world.logEvent({
  //     type: "collect-sunlight",
  //     leaf: cell,
  //     air,
  //     // the renderer creates one dot per sunlight unit.
  //     // 0.025 normalizes chancePerSecond (which is 0.025 for photosynthesis 3),
  //     // * 20 means photosynthesis 3 gets 20 dots per second (this is the new player experience)
  //     numSunlight: (intersectionChancePerSecond / 0.025) * dt * 20,
  //     point: new Vector2(p.x, p.y),
  //   });
  // }
  // let chancePerSecond = ambientChancePerSecond + intersectionChancePerSecond; // * (waterToConvert / bestEfficiencyWater);

  const chancePerSecond = ambientChancePerSecond;

  state.averageChancePerSecond += chancePerSecond;

  if (Math.random() < chancePerSecond * dt && waterToConvert > 0) {
    const sugarMade = waterToConvert * conversionRate;
    cell.inventory.add(-waterToConvert, sugarMade);
    state.sugarConverted += sugarMade;
    state.totalSugarProduced += sugarMade;
    cell.world.logEvent({
      type: "photosynthesis",
      cell,
      sugarMade,
    });
  }
}
