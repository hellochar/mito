import { EventCollectSunlight } from "core/tile/tileEvent";
import { textureFromSpritesheet } from "game/spritesheet";
import { clamp, randElement, randFloat } from "math";
import { polyEarlyUpDown } from "math/easing";
import { Color } from "three";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { InstancedTileRenderer } from "../tile/InstancedTileRenderer";
import { WorldRenderer } from "../WorldRenderer";
import { EventRenderer } from "./eventRenderer";

export default class EventCollectSunlightRenderer extends EventRenderer<EventCollectSunlight> {
  // private lightRays: LightRays;
  private ffPoints: FireAndForgetPoints;

  constructor(target: WorldRenderer) {
    super("collect-sunlight", target);
    // this.lightRays = new LightRays();
    // this.scene.add(this.lightRays.lineSegments);
    const duration = 0.5;
    // t.magFilter = LinearFilter;
    this.ffPoints = new FireAndForgetPoints(
      (s) => {
        if (s.time > duration) {
          return false;
        }
        const t = clamp(s.time / duration, 0, 1);
        s.alpha = polyEarlyUpDown(t);
        s.size = polyEarlyUpDown(t);
      },
      {
        color: new Color("white"),
        opacity: 0.8,
        size: 35,
        map: textureFromSpritesheet(0, 4),
      }
    );
    this.scene.add(this.ffPoints);
  }

  handle(event: EventCollectSunlight) {
    let { numSunlight, leaf, point } = event;
    while (numSunlight > 0) {
      // if numSunlight is 0.5, only show half the sunlight events
      if (numSunlight < 1 && numSunlight < Math.random()) {
        return;
      }

      let x = point == null ? leaf.pos.x + (Math.random() - 0.5) * 0.05 : point.x + randFloat(-0.1, 0.1);
      let y = point == null ? leaf.pos.y + (Math.random() - 0.5) * 0.05 : point.y + randFloat(-0.1, 0.1);
      const itr = this.worldRenderer.renderers.get(leaf) as InstancedTileRenderer;
      if (itr) {
        const randWaterPosition = itr.inventoryRenderer ? randElement(itr.inventoryRenderer.waters) : undefined;
        x += randWaterPosition?.x ?? 0;
        y += randWaterPosition?.y ?? 0;
      }
      this.ffPoints.fire({
        x,
        y,
        z: 10,
        size: 0,
        alpha: 0,
        info: 0,
        // stagger with the shouldUpdate of Tile so they look more continuous
        // time: Math.random() * (1 / 10),
        time: 0,
      });
      numSunlight--;
    }
  }

  update() {
    super.update();
    this.ffPoints.update(1 / 30);
    for (const event of this.target) {
      this.handle(event);
    }
    // this.lightRays.update(1 / 30);
    this.ffPoints.commitAll();
  }

  destroy() {
    this.scene.remove(this.ffPoints);
    // this.scene.remove(this.lightRays.lineSegments);
  }
}
