import { Cell } from "core/cell";

/**
 * Find a neighboring cell with resources, and try to take water and sugar from it.
 */
export function takeFromOneNeighborCell(cell: Cell, water: number, sugar: number) {
  const neighbors = cell.world.tileNeighbors(cell.pos);
  for (const [, tile] of neighbors) {
    if (tile instanceof Cell) {
      const { water: waterTaken, sugar: sugarTaken } = tile.inventory.give(cell.inventory, water, sugar);
      if (waterTaken > 0 || sugarTaken > 0) {
        break;
      }
    }
  }
}
