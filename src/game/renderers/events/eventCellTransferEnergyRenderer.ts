import { EventCellTransferEnergy } from "core/tile/tileEvent";
import { textureFromSpritesheet } from "game/spritesheet";
import { map } from "math";
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
        const { x, y } = from.pos.clone().lerp(to.pos, map(t, 0, 1, 0.45, 0.55));
        // const x = (from.pos.x + to.pos.x) / 2;
        // const y = (from.pos.y + to.pos.y) / 2;
        s.x = x;
        s.y = y;
        s.size = size;
      },
      {
        color: new Color("yellow"),
        opacity: 0.8,
        size: 350,
        map: textureFromSpritesheet(2, 3, "transparent"),
      }
    );
  }

  constructor(target: WorldRenderer) {
    super("cell-transfer-energy", target, EventCellTransferEnergyRenderer.makePoints());
  }

  handle(event: EventCellTransferEnergy) {
    const { from, to } = event;
    const r = Math.atan2(to.pos.y - from.pos.y, to.pos.x - from.pos.x);

    this.ffPoints.fire({
      x: event.from.pos.x,
      y: event.from.pos.y,
      r,
      z: 1,
      size: 0.1,
      alpha: 1,
      info: event,
      time: 0,
    });
  }
}
