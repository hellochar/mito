import { Entity } from "../../sketches/mito/game/entity";
import { TileEvent, TileEventType } from "../../sketches/mito/game/tileEvent";
export class StepStats {
  public events: TileEventLog = {
    "cell-eat": [],
    "cell-transfer-energy": [],
    evaporation: [],
    photosynthesis: [],
    thaw: [],
    "collect-sunlight": [],
    "grow-fruit": [],
  };

  constructor(public dt: number, public frame: number, public deleted: Entity[] = [], public added: Entity[] = []) {}

  logEvent(event: TileEvent) {
    this.events[event.type].push(event);
  }
}

export type TileEventLog = {
  [K in TileEventType]: TileEvent[];
};