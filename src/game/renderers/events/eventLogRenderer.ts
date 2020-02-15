import { TileEvent, TileEventType } from "../../../core/tile/tileEvent";
import { Renderer } from "../Renderer";
import { WorldRenderer } from "../WorldRenderer";
import EventCellEatRenderer from "./eventCellEatRenderer";
import EventCellTransferEnergyRenderer from "./eventCellTransferEnergyRenderer";
import EventCollectSunlightRenderer from "./eventCollectSunlightRenderer";
import EventEvaporationRenderer from "./eventEvaporationRenderer";
import EventGrowFruitRenderer from "./eventGrowFruitRenderer";
import EventPhotosynthesisRenderer from "./eventPhotosynthesisRenderer";
import { EventRenderer } from "./eventRenderer";
import EventThawIceRenderer from "./eventThawIceRenderer";

export class EventLogRenderer extends Renderer<WorldRenderer> {
  private singleEventRenderers = {
    "cell-eat": new EventCellEatRenderer(this.target),
    "cell-transfer-energy": new EventCellTransferEnergyRenderer(this.target),
    evaporation: new EventEvaporationRenderer(this.target),
    photosynthesis: new EventPhotosynthesisRenderer(this.target),
    thaw: new EventThawIceRenderer(this.target),
    "collect-sunlight": new EventCollectSunlightRenderer(this.target),
    "grow-fruit": new EventGrowFruitRenderer(this.target),
  } as { [K in TileEventType]?: EventRenderer<Extract<TileEvent, { type: K }>> };

  constructor(worldRenderer: WorldRenderer) {
    super(worldRenderer, worldRenderer.scene, worldRenderer.mito);
  }

  update() {
    const events = this.target.target.getLastStepStats().events;
    let eventName: TileEventType;
    for (eventName in events) {
      const renderer = this.singleEventRenderers[eventName];
      if (renderer != null) {
        renderer.update();
      }
    }
  }

  destroy() {
    for (const renderer of Object.values(this.singleEventRenderers)) {
      if (renderer != null) {
        renderer.destroy();
      }
    }
  }
}
