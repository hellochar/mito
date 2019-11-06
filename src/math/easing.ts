export function mirrored(f: (t: number) => number) {
  // https://bl.ocks.org/mbostock/3145795
  return (t: number) => (t < 0.5 ? f(2 * t) : f(2 - 2 * t));
}

export function reversed(f: (t: number) => number) {
  return (t: number) => f(1 - t);
}
