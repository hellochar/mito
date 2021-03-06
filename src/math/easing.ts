import { clamp } from "math";

export function mirrored(f: (t: number) => number) {
  // https://bl.ocks.org/mbostock/3145795
  return (t: number) => (t < 0.5 ? f(2 * t) : f(2 - 2 * t));
}

export function reversed(f: (t: number) => number) {
  return (t: number) => f(1 - t);
}

/**
 * t - t^2, scaled between 0-1
 * 0 = 0
 * 0.5 = 1
 * 1 = 0
 */
export function polyUpDown(t: number) {
  return 4 * (t - t * t);
}

export function smoothstep(t: number) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * (t^2-t^3) scaled to 0 and 1
 * 0 = 0
 * ...smooth upwards curve
 * 2/3 = 1
 * ...sharper downards curve
 * 1 = 0
 */
export function polyLateUpDown(t: number) {
  return clamp((27 / 4) * (t * t - t * t * t), 0, 1);
}

export const polyEarlyUpDown = reversed(polyLateUpDown);
