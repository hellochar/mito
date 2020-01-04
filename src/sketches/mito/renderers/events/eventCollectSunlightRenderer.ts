import { polyEarlyUpDown } from "math/easing";
import { EventCollectSunlight } from "sketches/mito/game/tileEvent";
import { textureFromSpritesheet } from "sketches/mito/spritesheet";
import { Color, Vector2 } from "three";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
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
    const t = textureFromSpritesheet(0, 4);
    // t.magFilter = LinearFilter;
    this.ffPoints = new FireAndForgetPoints(
      (s) => {
        if (s.time > duration) {
          return false;
        }
        const t = s.time / duration;
        s.alpha = polyEarlyUpDown(t);
        s.size = polyEarlyUpDown(t);
      },
      {
        color: new Color("white"),
        opacity: 0.95,
        size: 30,
        map: t,
      }
    );
    this.scene.add(this.ffPoints);
  }

  handle(event: EventCollectSunlight) {
    const { air, amount, leaf } = event;
    if (amount < Math.random()) {
      return;
    }
    let end: Vector2;
    // if (air.pos.x === leaf.pos.x) {
    //   // same X; average Y and move X randomly
    //   end = new Vector2(leaf.pos.x + (Math.random() - 0.5), lerp(leaf.pos.y, air.pos.y, 0.5));
    // } else {
    //   // same Y; average X and move Y randomly
    //   end = new Vector2(lerp(leaf.pos.x, air.pos.x, 0.5), leaf.pos.y + (Math.random() - 0.5));
    // }
    this.ffPoints.fire({
      x: leaf.pos.x + (Math.random() - 0.5),
      y: leaf.pos.y + (Math.random() - 0.5),
      z: 10,
      size: 1,
      alpha: 1,
      info: 0,
      // stagger with the shouldUpdate of Tile so they look more continuous
      time: Math.random() * (1 / 10),
    });
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
