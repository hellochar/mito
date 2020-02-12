import { EventGrowFruit } from "core/tile/tileEvent";
import { easeCubicIn } from "d3-ease";
import { map } from "math";
import { polyUpDown } from "math/easing";
import { textureFromSpritesheet } from "sketches/mito/spritesheet";
import { Color } from "three";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { WorldRenderer } from "../WorldRenderer";
import { EventRendererFFPoints } from "./eventRendererFFPoints";

export default class EventGrowFruitRenderer extends EventRendererFFPoints<EventGrowFruit> {
  static makePoints() {
    const duration = 1.0;
    return new FireAndForgetPoints(
      (s) => {
        if (s.time > duration) {
          return false;
        }
        const t = s.time / duration;

        const { cell, resourcesUsed, a0 } = s.info;
        const dist = map(easeCubicIn(t), 0, 1, 0.5, 0.25);
        const angle = map(t, 0, 1, 0, Math.PI * 2) + a0;
        const size = Math.sqrt(polyUpDown(t)) * resourcesUsed;
        s.x = cell.pos.x + Math.cos(angle) * dist;
        s.y = cell.pos.y + Math.sin(angle) * dist;
        s.size = size;
        s.r = angle;
      },
      {
        size: 200,
        opacity: 0.8,
        color: MUTATION_PURPLE,
        map: textureFromSpritesheet(0, 4),
      }
    );
  }

  constructor(target: WorldRenderer) {
    super("grow-fruit", target, EventGrowFruitRenderer.makePoints());
  }

  handle(event: EventGrowFruit) {
    const { cell } = event;

    for (let i = 0; i < 4; i++) {
      this.ffPoints.fire({
        x: cell.pos.x,
        y: cell.pos.y,
        z: 1,
        alpha: 1,
        info: { ...event, a0: Math.random() * Math.PI * 2 },
        size: 0,
        time: 0,
      });
    }
  }
}

const MUTATION_PURPLE = new Color("purple");
