import { ResourceIcon } from "game/ui/common/ResourceIcon";
import React from "react";
import { Gene } from "../../core/cell/gene";

const WATER_MIN = 2;
const WATER_MAX = 5;
const PERCENT_FASTER = 1;

export const GeneHydrostasis = Gene.make({
  name: "Hydrostasis",
  levelCosts: [4],
  levelProps: {},
  description: () => (
    <>
      If this cell holds between {WATER_MIN} and {WATER_MAX} <ResourceIcon name="water" />, it operates{" "}
      <b>{PERCENT_FASTER * 100}%</b> faster.
    </>
  ),
  dynamic(cell, properties) {
    const { water } = cell.inventory;
    if (water >= WATER_MIN && water <= WATER_MAX) {
      properties.tempo *= 1 + PERCENT_FASTER;
    }
    return properties;
  },
});
export type GeneHydrostasis = typeof GeneHydrostasis;
