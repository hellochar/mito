import { easeSinOut } from "d3-ease";
import { map } from "math";
import { Color } from "three";
import { FireAndForgetPoints } from "../fireAndForgetPoints";

const duration = 5;
const fruitSparkle = new FireAndForgetPoints<{ dx: number; dy: number }>(
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
    size: 20,
    opacity: 0.8,
    color: new Color("white"),
    // map: textureFromSpritesheet(0, 3),
  }
);

fruitSparkle.name = "Fruit Sparkle FFPoints";
fruitSparkle.renderOrder = 10;

export default fruitSparkle;
