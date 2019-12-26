import { TileEvent } from "sketches/mito/game/tileEvent";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { Renderer } from "../Renderer";
import { WorldRenderer } from "../WorldRenderer";

export abstract class EventRenderer<T extends TileEvent> extends Renderer<T[]> {
  constructor(public eventName: T["type"], public worldRenderer: WorldRenderer, public ffPoints: FireAndForgetPoints) {
    super([], worldRenderer.scene, worldRenderer.mito);
    this.scene.add(this.ffPoints);
  }

  abstract handle(event: T): void;

  update() {
    this.target = this.worldRenderer.target.getLastStepStats().events[this.eventName] as T[];
    this.ffPoints.update(1 / 30);
    for (const event of this.target) {
      this.handle(event);
    }
    this.ffPoints.commitAll();
  }

  destroy() {
    this.scene.remove(this.ffPoints);
  }
}
