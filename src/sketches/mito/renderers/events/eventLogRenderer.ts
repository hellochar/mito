import { TileEventType } from "../../game/tileEvent";
import { Renderer } from "../Renderer";
import { WorldRenderer } from "../WorldRenderer";
import EventCellEatRenderer from "./eventCellEatRenderer";
import EventCellTransferEnergyRenderer from "./eventCellTransferEnergyRenderer";
import EventEvaporationRenderer from "./eventEvaporationRenderer";
import EventPhotosynthesisRenderer from "./eventPhotosynthesisRenderer";

export class EventLogRenderer extends Renderer<WorldRenderer> {
  private singleEventRenderers = {
    "cell-eat": new EventCellEatRenderer(this.target),
    "cell-transfer-energy": new EventCellTransferEnergyRenderer(this.target),
    evaporation: new EventEvaporationRenderer(this.target),
    photosynthesis: new EventPhotosynthesisRenderer(this.target),
  } as const;

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
