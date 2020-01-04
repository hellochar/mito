import { EventCellTransferEnergy } from "sketches/mito/game/tileEvent";
import { textureFromSpritesheet } from "sketches/mito/spritesheet";
import { Color } from "three";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { WorldRenderer } from "../WorldRenderer";
import { EventRendererFFPoints } from "./eventRendererFFPoints";

export default class EventCellTransferEnergyRenderer extends EventRendererFFPoints<EventCellTransferEnergy> {
  static makePoints() {
    const duration = 0.5;
    return new FireAndForgetPoints<EventCellTransferEnergy>(
      (s) => {
        if (s.time > duration) {
          return false;
        }
        const t = s.time / duration;
        const size = 4 * (t - t * t);

        const { from, to } = s.info;
        // const { x, y } = s.info.from.pos.clone().lerp(s.info.to.pos, map(t, 0, 1, 0.4, 0.6));
        const x = (from.pos.x + to.pos.x) / 2;
        const y = (from.pos.y + to.pos.y) / 2;
        const r = Math.atan2(to.pos.y - from.pos.y, to.pos.x - from.pos.x);
        s.x = x;
        s.y = y;
        s.r = r;
        s.size = size;
      },
      {
        color: new Color("yellow"),
        opacity: 0.8,
        size: 200,
        map: textureFromSpritesheet(2, 3, "transparent"),
      }
    );
  }

  constructor(target: WorldRenderer) {
    super("cell-transfer-energy", target, EventCellTransferEnergyRenderer.makePoints());
  }

  handle(event: EventCellTransferEnergy) {
    this.ffPoints.fire({
      x: event.from.pos.x,
      y: event.from.pos.y,
      z: 1,
      size: 1,
      alpha: 1,
      info: event,
      time: 0,
    });
  }
}
