import { EventPhotosynthesis } from "sketches/mito/game/tileEvent";
import { textureFromSpritesheet } from "sketches/mito/spritesheet";
import { Color } from "three";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { InstancedTileRenderer } from "../tile/InstancedTileRenderer";
import { WorldRenderer } from "../WorldRenderer";
import { EventRenderer } from "./eventRenderer";

export default class EventPhotosynthesisRenderer extends EventRenderer<EventPhotosynthesis> {
  static makePoints() {
    const duration = 0.5;
    return new FireAndForgetPoints<EventPhotosynthesis>(
      (s) => {
        if (s.time > duration) {
          return false;
        }
        const t = s.time / duration;

        s.alpha = (4 * (t - t * t)) ** (1 / 4);
        s.size = 2 - t * 2;
        s.r = t * s.time;
      },
      {
        color: new Color("yellow"),
        opacity: 0.8,
        size: 200,
        map: textureFromSpritesheet(3, 3, "transparent"),
      }
    );
  }

  constructor(target: WorldRenderer) {
    super("photosynthesis", target, EventPhotosynthesisRenderer.makePoints());
  }

  handle(event: EventPhotosynthesis) {
    const tileRenderer = this.worldRenderer.renderers.get(event.where) as InstancedTileRenderer | null;
    const stableWater = tileRenderer && tileRenderer.inventoryRenderer.getStableWater();
    const dX = (stableWater && stableWater.x) || 0;
    const dY = (stableWater && stableWater.y) || 0;
    this.ffPoints.fire({
      x: event.where.pos.x + dX,
      y: event.where.pos.y + dY,
      z: 1,
      size: 1,
      alpha: 1,
      info: event,
      time: 0,
    });
  }
}
