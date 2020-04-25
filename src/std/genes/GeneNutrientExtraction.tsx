import { TIME_PER_DAY } from "core/constants";
import { Soil } from "core/tile";
import { BarrenLand } from "core/tile/BarrenLand";
import React from "react";
import { Gene } from "../../core/cell/gene";

export const GeneNutrientExtraction = Gene.make(
  {
    name: "Nutrient Extraction",
    levelCosts: [1, 1, 1, 1, 4],
    levelProps: {
      energyPerSecond: [0.02, 0.03, 0.04, 0.05, 0.1],
    },
    static: {
      energyUpkeep: 1 / 720,
    },
    description: ({ energyPerSecond }) => (
      <>
        <p>
          While this cell has a neighboring Soil, it gets <b>{energyPerSecond * 100}%</b> energy per second.
        </p>
        <p>
          Every <b>{TIME_PER_DAY}</b> seconds, turn one neighboring Soil into Barren Land.{" "}
          <i>(Barren Land is not a Soil).</i>
        </p>
      </>
    ),
  },
  {
    hasMonthPassed: false,
    cooldown: TIME_PER_DAY,
    soil: null as Soil | null,
  },
  (dt, { cell, props, state }) => {
    // something else has bumped the soil
    if (state.soil != null && cell.world.tileAt(state.soil.pos) !== state.soil) {
      state.soil = null;
    }
    if (state.soil == null) {
      const neighbors = cell.world.tileNeighbors(cell.pos);
      for (const [, tile] of neighbors) {
        if (tile instanceof Soil) {
          state.soil = tile;
          break;
        }
      }
    }

    if (state.soil != null) {
      // cell.energy = clamp(cell.energy + props.energyPerSoilPerSecond * dt, 0, 1);
      cell.energy += props.energyPerSecond * dt;
      cell.world.logEvent({
        type: "cell-transfer-energy",
        amount: props.energyPerSecond * dt,
        from: state.soil,
        to: cell,
      });
      cell.world.logEvent({
        type: "cell-eat",
        who: state.soil,
      });
    }

    if (state.cooldown <= 0 && state.soil != null) {
      const barrenSoil = new BarrenLand(state.soil.pos, state.soil.world);
      state.soil.world.setTileAt(barrenSoil.pos, barrenSoil);
      state.soil = null;
      state.cooldown += TIME_PER_DAY;
    }
    state.cooldown -= dt;
  }
);
export type GeneNutrientExtraction = typeof GeneNutrientExtraction;
