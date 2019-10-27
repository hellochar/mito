import testVignetteUrl from "assets/images/test-vignette.png";
import { sleep } from "common/promise";
import { scaleLinear } from "d3-scale";
import { Species } from "evolution/species";
import { generateNaturalRandomHexagonPoints, pixelPosition } from "overworld/hexMath";
import { HexTile } from "overworld/hexTile";
import { Vector2 } from "three";
import { CameraState } from "./OverWorldMap";


const testVignette = new Image();
testVignette.src = testVignetteUrl;

const COLOR_SCALE_HEIGHT = scaleLinear<string, string>()
  .domain([-1, 0, 1, 5, 6])
  .range(["rgb(0, 60, 255)", "lightblue", "yellow", "orange"]);

export default class HexTileSprite {
  private vignettePositions?: Vector2[];
  constructor(public tile: HexTile) { }

  draw(c: CanvasRenderingContext2D, camera: CameraState) {
    const { scale } = camera;
    const [px, py] = pixelPosition(this.tile, camera);

    if (this.tile.info.visible) {
      c.fillStyle = COLOR_SCALE_HEIGHT(this.tile.info.height);
      c.fillStyle = COLOR_SCALE_HEIGHT(this.tile.info.height);
      drawHex(c, px, py, scale);
      c.font = `${12 * scale / 48}px serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "#666";
      c.fillText(this.tile.info.height + "", px, py, scale);
      // draw vignettes
      if (this.tile.info.flora != null) {
        this.updateVignettes(c, this.tile.info.flora.species, px, py, scale);
      }
    } else {
      c.strokeStyle = "rgb(112, 112, 112)";
      drawHex(c, px, py, scale, false);
    }
  }

  updateVignettes(c: CanvasRenderingContext2D, species: Species, px: number, py: number, scale: number) {
    if (this.vignettePositions == null) {
      const positions = generateNaturalRandomHexagonPoints(0.2).sort((a, b) => a.y - b.y);
      this.vignettePositions = [];
      const vignettePositions = this.vignettePositions;
      (async function () {
        for (const p of positions) {
          vignettePositions.push(p);
          await sleep(300);
        }
      })();
    }
    const sizeScale = scale / 48 / 2;
    for (const p of this.vignettePositions) {
      c.drawImage(
        testVignette,
        px + p.x * scale - testVignette.width / 2 * sizeScale,
        py + p.y * scale - testVignette.height * sizeScale,
        testVignette.width * sizeScale,
        testVignette.height * sizeScale,
      );
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

function drawHex(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill = true) {
  c.beginPath();
  c.moveTo(x + r, y);
  for (let i = 1; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    c.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  c.closePath();
  if (fill) {
    c.fill();
  }
  c.stroke();
}
