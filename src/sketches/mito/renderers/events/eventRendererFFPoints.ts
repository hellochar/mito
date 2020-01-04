import { TileEvent } from "sketches/mito/game/tileEvent";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { WorldRenderer } from "../WorldRenderer";
import { EventRenderer } from "./eventRenderer";

export abstract class EventRendererFFPoints<T extends TileEvent> extends EventRenderer<T> {
  constructor(public eventName: T["type"], public worldRenderer: WorldRenderer, public ffPoints: FireAndForgetPoints) {
    super(eventName, worldRenderer);
    this.scene.add(this.ffPoints);
  }

  abstract handle(event: T): void;

  update() {
    super.update();
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
