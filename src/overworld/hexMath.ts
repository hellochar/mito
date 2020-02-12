import { poissonDisc } from "math/poissonDisc";
import { Vector2 } from "three";
import { HexTile } from "../core/hexTile";
import { CameraState } from "./map/OverWorldMap";

/**
 * Tiled hexes are not square - they are rectangular, where
 * the pointy-to-pointy direction is length 1 and the edge-to-edge
 * direction is length sqrt(3) / 2. Since we have flat-topped
 * hexes, the Y gets the squish factor.
 */
export const Y_SQUISH_FACTOR = Math.sqrt(3) / 2;

export function getClickedHexCoords(canvas: HTMLCanvasElement, camera: CameraState, event: React.MouseEvent) {
  const { scale, dX, dY } = camera;
  const cX = canvas.width / 2 + dX;
  const cY = canvas.height / 2 + dY;

  const e = event.nativeEvent;
  const pxX = e.offsetX;
  const pxY = e.offsetY;
  const x = (pxX - cX) / scale;
  const y = (pxY - cY) / scale;
  // we now have a fractional cartesian coordinates
  // now we flip the equations:

  // x = 1.5i
  // i = x / 1.5

  // y = 2Cj + Ci
  // j = (y - Ci) / (2 * C)

  const i = x / 1.5;
  const j = (y - Y_SQUISH_FACTOR * i) / (2 * Y_SQUISH_FACTOR);
  const k = -(i + j);

  return roundCubeCoordinates(i, j, k);
}

export function roundCubeCoordinates(i: number, j: number, k: number) {
  var rx = Math.round(i);
  var ry = Math.round(j);
  var rz = Math.round(k);

  var x_diff = Math.abs(rx - i);
  var y_diff = Math.abs(ry - j);
  var z_diff = Math.abs(rz - k);

  if (x_diff > y_diff && x_diff > z_diff) {
    rx = -ry - rz;
  } else if (y_diff > z_diff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  return { i: rx, j: ry, k: rz };
}

export function pixelPosition(tile: HexTile, camera: CameraState) {
  const { dX, dY, scale } = camera;
  const { x, y } = tile.cartesian;

  const cX = window.innerWidth / 2 + dX;
  const cY = window.innerHeight / 2 + dY;
  return [cX + x * scale, cY + y * scale];
}

/**
 * Get the camera state that would center the camera on hex with the given scale.
 */
export function getCameraPositionCenteredOn(hex: HexTile, scale: number) {
  const { x, y } = hex.cartesian;
  const cX = window.innerWidth / 2 - x * scale;
  const cY = window.innerHeight / 2 - y * scale;

  const dX = cX - window.innerWidth / 2;
  const dY = cY - window.innerHeight / 2;

  return [dX, dY];
}

export const randomPointInHexagon = (() => {
  const vectors = [new Vector2(-1, 0), new Vector2(0.5, Y_SQUISH_FACTOR), new Vector2(0.5, -Y_SQUISH_FACTOR)];

  return (scale: number) => {
    // adapted from https://stackoverflow.com/a/3241819
    const vIndex = Math.floor(Math.random() * 3);
    const [v1, v2] = [vectors[vIndex], vectors[(vIndex + 1) % 3]];
    const [v1Scale, v2Scale] = [Math.random(), Math.random()];
    const [x, y] = [v1Scale * v1.x + v2Scale * v2.x, v1Scale * v1.y + v2Scale * v2.y];
    return new Vector2(x * scale, y * scale);
  };
})();

export const generateNaturalRandomHexagonPoints = (radius: number, dropFirst = false) => {
  const width = 2;
  const height = Y_SQUISH_FACTOR * width;
  // const areaAvailable = width * height;
  // const radius = areaAvailable / maxPoints * 0.5; // technically you could get pretty close with .8; but do 0.5 for some more leeway
  const samples = poissonDisc({ width, height, radius, initialSample: [width / 2, height / 2], max: 10000 });
  const normSamples = samples
    .map((s) => {
      s.x -= width / 2;
      s.y -= height / 2;
      return s;
    })
    .filter((s) => isPointInHexagon(s.x, s.y));
  if (dropFirst) {
    normSamples.shift();
  }
  return normSamples;
};

/**
 * Return true if the point is inside a radius 1 hexagon (width 2, height sqrt(3))
 */
export const isPointInHexagon = (() => {
  const RADIUS = 1;
  const HALF_HEIGHT = RADIUS * Y_SQUISH_FACTOR;
  // based on http://www.playchilla.com/how-to-check-if-a-point-is-inside-a-hexagon
  return (x: number, y: number) => {
    // transform the test point locally and to quadrant 2
    const q2x = Math.abs(x);
    const q2y = Math.abs(y);
    // bounding test (since q2 is in quadrant 2 only 2 tests are needed)
    if (q2x > RADIUS || q2y > HALF_HEIGHT) {
      return false;
    }
    // dot product can be reduced to this due to the hexagon symmetry
    // return HALF_HEIGHT * RADIUS * q2x - RADIUS * q2y >= 0;
    return RADIUS * HALF_HEIGHT - HALF_HEIGHT * q2x - 0.5 * q2y >= 0;
  };
})();
