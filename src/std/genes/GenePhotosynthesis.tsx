import React from "react";
import GN from "sketches/mito/ui/GN";
import { Vector2 } from "three";
import { Cell } from "../../core/cell/cell";
import { Gene } from "../../core/cell/chromosome";
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
    levelCosts: [3, 6, 9, 12, 15],
    levelProps: {
      reactionChancePerSecond: [0.00625, 0.0125, 0.025, 0.05, 0.1],
    },
    description: ({ reactionChancePerSecond }) => (
      <>
        Each neighboring Air provides a <GN value={reactionChancePerSecond * 100} sigFigs={3} />% chance per second,
        scaled with sunlight, to convert up to 2 Water into 1 Sugar.
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
      if (tile instanceof Air) {
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
  // const conversionRate = air.co2();

  const conversionRate = 0.5;
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
  cell.world.logEvent({
    type: "collect-sunlight",
    leaf: cell,
    air,
    // the renderer creates one dot per sunlight unit.
    // 0.025 normalizes chancePerSecond (which is 0.025 for photosynthesis 3),
    // * 20 means photosynthesis 3 gets 20 dots per second (this is the new player experience)
    numSunlight: (ambientChancePerSecond / 0.025) * dt * 20,
  });

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
    const sugarConverted = waterToConvert * conversionRate;
    cell.inventory.add(-waterToConvert, sugarConverted);
    state.sugarConverted += sugarConverted;
    state.totalSugarProduced += sugarConverted;
    cell.world.logEvent({
      type: "photosynthesis",
      cell,
      amount: sugarConverted,
    });
  }
}
