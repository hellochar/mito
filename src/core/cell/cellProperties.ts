import { CELL_BUILD_TIME } from "core/constants";

export type CellProperties = {
  cantFreeze: boolean;
  isReproductive: boolean;
  isDirectional: boolean;
  isObstacle: boolean;
  inventoryCapacity: number;
  costSugar: number;
  costWater: number;
  diffusionWater: number;
  diffusionSugar: number;
  timeToBuild: number;
  [k: string]: number | boolean;
};

export function defaultCellProperties(): CellProperties {
  return {
    cantFreeze: false,
    isReproductive: false,
    isObstacle: false,
    inventoryCapacity: 0,
    costSugar: 1,
    costWater: 1,
    diffusionWater: 0,
    diffusionSugar: 0,
    timeToBuild: CELL_BUILD_TIME,
    isDirectional: false,
  };
}
