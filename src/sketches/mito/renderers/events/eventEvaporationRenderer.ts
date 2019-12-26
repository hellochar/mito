import { EventEvaporation } from "sketches/mito/game/tileEvent";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { InventoryRenderer } from "../InventoryRenderer";
import { InstancedTileRenderer } from "../tile/InstancedTileRenderer";
import { WorldRenderer } from "../WorldRenderer";
import { EventRenderer } from "./eventRenderer";

export default class EventEvaporationRenderer extends EventRenderer<EventEvaporation> {
  static makePoints() {
    const duration = 1.5;
    return new FireAndForgetPoints<EventEvaporation>(
      (s) => {
        if (s.time > duration) {
          return false;
        }
        const t = s.time / duration;
        const size = 1 + t;
        const alpha = 1 - t;

        s.x += Math.sin(t * 12) * 0.01;
        s.y -= 0.01;
        s.alpha = alpha;
        s.size = size;
      },
      { ...InventoryRenderer.WaterParticles().params }
    );
  }

  constructor(target: WorldRenderer) {
    super("evaporation", target, EventEvaporationRenderer.makePoints());
  }

  handle(event: EventEvaporation) {
    if (event.tile.darkness >= 1) {
      return;
    }
    const tileRenderer = this.worldRenderer.renderers.get(event.tile) as InstancedTileRenderer | null;
    const stableWater = tileRenderer && tileRenderer.inventoryRenderer.getStableWater();
    const dX = (stableWater && stableWater.x) || 0;
    const dY = (stableWater && stableWater.y) || 0;
    this.ffPoints.fire({
      x: event.tile.pos.x + dX,
      y: event.tile.pos.y + dY,
      z: 1,
      size: 1,
      alpha: 1,
      info: event,
      time: 0,
    });
  }
}
