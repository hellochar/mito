import { EventGrowFruit } from "core/tile/tileEvent";
import { easeCubicIn } from "d3-ease";
import { textureFromSpritesheet } from "game/spritesheet";
import { map } from "math";
import { polyUpDown, smoothstep } from "math/easing";
import { Color } from "three";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { WorldRenderer } from "../WorldRenderer";
import { EventRendererFFPoints } from "./eventRendererFFPoints";

export default class EventGrowFruitRenderer extends EventRendererFFPoints<EventGrowFruit> {
  static makePoints() {
    const duration = 2.5;
    return new FireAndForgetPoints(
      (s) => {
        if (s.time > duration) {
          return false;
        }
        const t = s.time / duration;

        const { cell, resourcesUsed, a0 } = s.info;
        const dist = map(easeCubicIn(t), 0, 1, 1.0, 0.2);
        const angle = map(smoothstep(t), 0, 1, 0, Math.PI * 0.2) + a0;
        const size = Math.sqrt(polyUpDown(t)) * resourcesUsed;
        s.x = cell.pos.x + Math.cos(angle) * dist;
        s.y = cell.pos.y + Math.sin(angle) * dist;
        s.size = size;
        s.r = angle;
      },
      {
        size: 80,
        opacity: 0.8,
        color: new Color("purple"),
        map: textureFromSpritesheet(0, 4),
      }
    );
  }

  constructor(target: WorldRenderer) {
    super("grow-fruit", target, EventGrowFruitRenderer.makePoints());
  }

  handle(event: EventGrowFruit) {
    const { cell } = event;

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
