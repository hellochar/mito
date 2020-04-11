import { CELL_BUILD_TIME } from "core/constants";

export type CellProperties = {
  cantFreeze: boolean;
  isReproductive: boolean;
  isDirectional: boolean;
  isObstacle: boolean;
  inventoryCapacity: number;
  /**
   * Sugar cost to build.
   */
  costSugar: number;
  /**
   * Water cost to build.
   */
  costWater: number;
  diffusionWater: number;
  diffusionSugar: number;
  /**
   * Seconds it take to build.
   */
  timeToBuild: number;
  /**
   * How fast Genes and Effects happen on the cell.
   */
  tempo: number;
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
    tempo: 1,
    timeToBuild: CELL_BUILD_TIME,
    isDirectional: false,
  };
}
