import { HasInventory } from "../inventory";
import { Air, Cell, Fruit, Soil } from "./tile";

export function canPullResources(receiver: HasInventory, giver: HasInventory): boolean {
  // allow direct ancestors/child relationships to exchange resources with each other (e.g. Soil and Fountain)
  const hasAncestry = receiver instanceof giver.constructor || giver instanceof receiver.constructor;

  // allow all Cells to give to each other
  const areCells = receiver instanceof Cell && giver instanceof Cell;

  // don't allow other cells to pull from fruit
  const giverIsNotFruit = !(giver instanceof Fruit);

  const areSoils = receiver instanceof Soil && giver instanceof Soil;

  // specifically allow air to give to soil
  const isAirToSoil = receiver instanceof Soil && giver instanceof Air;

  return hasAncestry || areSoils || (areCells && giverIsNotFruit) || isAirToSoil;
}
