import { Constructor } from "../constructor";
import { HasInventory } from "../inventory";
import { Air, Cell, Soil } from "./tile";

export function allowPull(receiver: any, recieverType: Constructor<any>, giver: any, giverType: Constructor<any>) {
  return receiver instanceof recieverType && giver instanceof giverType;
}

export function canPullResources(receiver: HasInventory, giver: HasInventory): boolean {
  // allow ancestors and children to exchange resources with each other (e.g. Soil and Fountain)
  const hasAncestry = (
    receiver instanceof giver.constructor ||
    giver instanceof receiver.constructor
  );

  // allow all Cells to give to each other
  const areCells = receiver instanceof Cell && giver instanceof Cell;

  // specifically allow air to give to soil
  const isAirToSoil = allowPull(receiver, Soil, giver, Air);

  return hasAncestry || areCells || isAirToSoil;
}
