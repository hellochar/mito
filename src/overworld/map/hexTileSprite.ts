import { PopulationAttempt } from "app";
import testVignetteUrl from "assets/images/test-vignette.png";
import { sleep } from "common/promise";
import { easeExpIn } from "d3-ease";
import { scaleLinear } from "d3-scale";
import { Species } from "evolution/species";
import Ticker from "global/ticker";
import { clamp, map, sawTooth } from "math";
import { generateNaturalRandomHexagonPoints, pixelPosition } from "overworld/hexMath";
import { HexTile } from "overworld/hexTile";
import { Vector2 } from "three";
import { CameraState } from "./OverWorldMap";

const testVignette = new Image();
testVignette.src = testVignetteUrl;

const COLOR_SCALE_HEIGHT = scaleLinear<string, string>()
  .domain([-1, 0, 1, 5, 6])
  .range(["rgb(0, 60, 255)", "lightblue", "yellow", "orange"]);

export interface DrawingContext {
  populationAttempt?: PopulationAttempt;
  highlightedHex?: HexTile;
}

export default class HexTileSprite {
  private vignettePositions?: Vector2[];
  private isHovered = false;

  constructor(public tile: HexTile, public context: DrawingContext) {}

  public get zIndex() {
    let z = this.tile.cartesian.y;
    if (this.tile.info.flora != null) {
      z += 1000;
    }
    return z;
  }

  public get isShadowed() {
    if (this.context.highlightedHex != null) {
      return this.context.highlightedHex !== this.tile;
    } else if (this.context.populationAttempt != null) {
      return (
        this.context.populationAttempt.sourceHex !== this.tile && this.context.populationAttempt.targetHex !== this.tile
      );
    } else {
      return false;
    }
  }

  /**
   * This resets every draw.
   */
  setIsHovered() {
    this.isHovered = true;
  }

  draw(c: CanvasRenderingContext2D, camera: CameraState) {
    const { scale } = camera;
    const [px, py] = pixelPosition(this.tile, camera);

    c.lineWidth = (1 * scale) / 48;

    if (this.isShadowed) {
      c.globalAlpha = 0.2;
    } else {
      c.globalAlpha = 1;
    }
    if (this.tile.info.visible) {
      // base color
      c.fillStyle = COLOR_SCALE_HEIGHT(this.tile.info.height);
      c.strokeStyle = "rgb(112, 112, 112)";
      drawHex(c, px, py, scale);

      // 0-6 number (can be covered by vignettes)
      if (!this.isHovered) {
        this.drawNumericHeight(c, scale, px, py);
      }

      // "active" pulse
      if (this.tile.info.flora != null) {
        this.drawVignettes(c, this.tile.info.flora.species, px, py, scale);
      }
    } else {
      c.strokeStyle = "rgb(112, 112, 112)";
      drawHex(c, px, py, scale, false);
    }

    // hovered outline
    if (this.isHovered) {
      c.strokeStyle = "rgb(112, 112, 112)";
      c.lineWidth = (1 * scale) / 48;
      drawCircle(c, px, py, (scale / 48) * 12, false);
      if (this.tile.info.visible) {
        this.drawNumericHeight(c, scale, px, py);
      }
    }

    this.isHovered = false;
  }

  private static easePulse = easeExpIn;

  public drawActivePulse(c: CanvasRenderingContext2D, scale: number, px: number, py: number) {
    for (let i = 0; i < 10; i++) {
      this.drawPulse(i / 10, c, scale, px, py);
    }
  }

  private drawPulse(tOffset: number, c: CanvasRenderingContext2D, scale: number, px: number, py: number) {
    const thickness = map(
      HexTileSprite.easePulse(clamp(map(sawTooth(Ticker.now / 6000 + tOffset), 0, 1, -1, 2), -Infinity, 1)),
      0,
      1,
      0,
      20
    );
    c.lineWidth = (thickness * scale) / 48;
    const a = 100 / (thickness * thickness * thickness);
    c.strokeStyle = `rgba(255, 255, 255, ${a})`;
    drawHex(c, px, py, scale + c.lineWidth / 2, false);
  }

  private drawNumericHeight(c: CanvasRenderingContext2D, scale: number, px: number, py: number) {
    c.font = `${(12 * scale) / 48}px serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#666";
    c.fillText(this.tile.info.height + "", px, py, scale);
  }

  drawVignettes(c: CanvasRenderingContext2D, species: Species, px: number, py: number, scale: number) {
    if (this.vignettePositions == null) {
      const positions = generateNaturalRandomHexagonPoints(0.3, true); //.sort((a, b) => a.y - b.y);
      this.vignettePositions = [];
      const vignettePositions = this.vignettePositions;
      (async function() {
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
        px + p.x * scale - (testVignette.width / 2) * sizeScale,
        py + p.y * scale - testVignette.height * sizeScale,
        testVignette.width * sizeScale,
        testVignette.height * sizeScale
      );
    }
  }
}

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

function drawCircle(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill = true) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arc(x, y, r, 0, Math.PI * 2);
  // for (let i = 1; i < 6; i++) {
  //   const angle = (i / 6) * Math.PI * 2;
  //   c.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  // }
  // c.closePath();
  if (fill) {
    c.fill();
  }
  c.stroke();
}
