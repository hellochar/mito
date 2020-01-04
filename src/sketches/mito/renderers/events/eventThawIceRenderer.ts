import { easeSinOut } from "d3-ease";
import { map } from "math";
import { EventThawIce } from "sketches/mito/game/tileEvent";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { FREEZE_BLUE } from "../tile/CellEffectsRenderer";
import { WorldRenderer } from "../WorldRenderer";
import { EventRendererFFPoints } from "./eventRendererFFPoints";

export default class EventThawIceRenderer extends EventRendererFFPoints<EventThawIce> {
  static makePoints() {
    const duration = 0.6;
    // fruitSparkle.renderOrder = 10;
    return new FireAndForgetPoints(
      (s, dt) => {
        if (s.time > duration) {
          return false;
        }
        const t = s.time / duration;
        const { dx, dy } = s.info;
        s.x += dx * dt;
        s.y += dy * dt;
        s.alpha = t < 0.75 ? 1 : easeSinOut(map(t, 0.75, 1, 1, 0));
      },
      {
        size: 40,
        opacity: 0.5,
        color: FREEZE_BLUE,
      }
    );
  }

  constructor(target: WorldRenderer) {
    super("thaw", target, EventThawIceRenderer.makePoints());
  }

  handle(event: EventThawIce) {
    const { where } = event;

    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      this.ffPoints.fire({
        x: where.pos.x,
        y: where.pos.y,
        z: 1,
        alpha: 1,
        info: { dx, dy },
        size: map(Math.random(), 0, 1, 0.5, 1.5),
        time: 0,
        r: angle,
      });
    }
  }
}
