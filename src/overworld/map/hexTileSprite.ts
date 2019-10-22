import { CameraState } from "./OverWorldMap";
import { HexTile } from "overworld/hexTile";
import { scaleLinear } from "d3-scale";
import { pixelPosition } from "overworld/hexMath";

import testVignetteUrl from "assets/images/test-vignette.png";

const testVignette = new Image();
testVignette.src = testVignetteUrl;

const COLOR_SCALE_HEIGHT = scaleLinear<string, string>()
  .domain([-1, 0, 1, 5, 6])
  .range(["rgb(0, 60, 255)", "lightblue", "yellow", "orange"]);

export default class HexTileSprite {
  constructor(public tile: HexTile) { }

  draw(c: CanvasRenderingContext2D, camera: CameraState) {
    const { scale } = camera;
    const [px, py] = pixelPosition(this.tile, camera);

    if (this.tile.info.visible) {
      c.fillStyle = COLOR_SCALE_HEIGHT(this.tile.info.height);
      drawHex(c, px, py, scale);
      c.font = "12px serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "#666";
      c.fillText(this.tile.info.height + "", px, py, scale);
      // draw vignettes
      const sizeScale = scale / 48 / 2;
      c.drawImage(
        testVignette,
        px - (testVignette.width / 2 - 22) * sizeScale,
        py - (testVignette.height / 2 + 30) * sizeScale,
        testVignette.width * sizeScale,
        testVignette.height * sizeScale,
      );

    } else {
      c.fillStyle = "grey";
      drawHex(c, px, py, scale);
    }
  }
}

// class AnimatedVignetteSprites {
//   public spritePositions: Vector2[] = [];
//   constructor(public image: CanvasImageSource) {
//     stagger(10 times, 30ms delay, (i, delay) => {
//       const randomPosition = randomPointInHex();
//       const s = new Sprite(image, randomPosition);
//       s.animate(over 1000 ms, (t) => { s.opacity = t / 1000 })
//       return s;
//     })
//   }

//   draw() {
//     draw all sprites
//   }
// }

function drawHex(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.strokeStyle = "rgb(112, 112, 112)";
  c.beginPath();
  c.moveTo(x + r, y);
  for (let i = 1; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    c.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  c.closePath();
  c.fill();
  c.stroke();
}
