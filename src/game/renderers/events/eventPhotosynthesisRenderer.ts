import { EventPhotosynthesis } from "core/tile/tileEvent";
import { textureFromSpritesheet } from "game/spritesheet";
import { polyUpDown } from "math/easing";
import { Color } from "three";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { InstancedTileRenderer } from "../tile/InstancedTileRenderer";
import { WorldRenderer } from "../WorldRenderer";
import { EventRendererFFPoints } from "./eventRendererFFPoints";

export default class EventPhotosynthesisRenderer extends EventRendererFFPoints<EventPhotosynthesis> {
  static makePoints() {
    const duration = 0.5;
    return new FireAndForgetPoints<EventPhotosynthesis>(
      (s) => {
        if (s.time > duration) {
          return false;
        }
        const t = s.time / duration;

        s.alpha = polyUpDown(t) ** (1 / 4);
        s.size = ((1 - t) ** 1 / 2) * 2 * s.info.sugarMade;
        s.r = t * s.time;
      },
      {
        color: new Color("yellow"),
        opacity: 0.95,
        size: 200,
        map: textureFromSpritesheet(3, 3),
      }
    );
  }

  constructor(target: WorldRenderer) {
    super("photosynthesis", target, EventPhotosynthesisRenderer.makePoints());
  }

  handle(event: EventPhotosynthesis) {
    const tileRenderer = this.worldRenderer.renderers.get(event.cell) as InstancedTileRenderer | null;
    const stableWater = tileRenderer?.inventoryRenderer?.getStableWater();
    const dX = stableWater?.x ?? 0;
    const dY = stableWater?.y ?? 0;
    this.ffPoints.fire({
      x: event.cell.pos.x + dX,
      y: event.cell.pos.y + dY,
      z: 1,
      size: 1,
      alpha: 1,
      info: event,
      time: 0,
    });
  }
}
