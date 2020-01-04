import { TileEvent } from "sketches/mito/game/tileEvent";
import { Renderer } from "../Renderer";
import { WorldRenderer } from "../WorldRenderer";

export abstract class EventRenderer<T extends TileEvent> extends Renderer<T[]> {
  constructor(public eventName: T["type"], public worldRenderer: WorldRenderer) {
    super([], worldRenderer.scene, worldRenderer.mito);
  }

  abstract handle(event: T): void;

  update() {
    this.target = this.worldRenderer.target.getLastStepStats().events[this.eventName] as T[];
  }
}
