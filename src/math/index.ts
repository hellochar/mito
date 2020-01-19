export * from "./random";

export function lerp(a: number, b: number, x: number) {
  return a + (b - a) * x;
}

export function lerp2(v: { x: number; y: number }, t: { x: number; y: number }, l: number) {
  v.x = v.x * (1 - l) + t.x * l;
  v.y = v.y * (1 - l) + t.y * l;
}

export function map(x: number, xStart: number, xStop: number, yStart: number, yStop: number) {
  return lerp(yStart, yStop, (x - xStart) / (xStop - xStart));
}

export function clamp(x: number, min: number, max: number) {
  return x < min ? min : x > max ? max : x;
}

export function sampleArray<T>(a: T[]) {
  return a[Math.floor(Math.random() * a.length)];
}

export function triangleWaveApprox(t: number) {
  return (8 / (Math.PI * Math.PI)) * (Math.sin(t) - (1 / 9) * Math.sin(3 * t) + (1 / 25) * Math.sin(5 * t));
}

/**
 * Get a random integer between floor(x) and ceil(x) such that, over many iterations,
 * randRound(x) gives an average of x.
 */
export function randRound(x: number) {
  const ix = Math.floor(x);
  const fx = x - ix;
  return ix + (Math.random() < fx ? 1 : 0);
}

// mod account for negatives
export function mod(t: number, m: number) {
  return ((t % m) + m) % m;
}

// perfect triangle wave that goes from [0, 1, 0] in x = [0, 1, 2]
export function mirroredRepeat(x: number) {
  return (1 - (Math.abs(mod(x * 2, 4) - 2) - 1)) / 2;
}

// goes [0, 1] every integer
export function sawTooth(x: number) {
  return mod(x, 1);
}

export function logistic(x: number) {
  if (x < -6) {
    return 0;
  } else if (x > 6) {
    return 1;
  }
  return 1 / (1 + Math.exp(-x));
}
