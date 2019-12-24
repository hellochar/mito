export function arrayRange<T = number>(length: number, fill?: T | ((i: number) => T)): T[] {
  return new Array(length).fill(undefined).map((_, i) => {
    if (typeof fill === "function") {
      return (fill as any)(i) as T;
    } else if (fill === undefined) {
      return i;
    } else {
      return fill;
    }
  }) as T[];
}

export function gridRange<T>(width: number, height: number, fill: (x: number, y: number) => T) {
  return arrayRange(width, (x) => arrayRange(height, (y) => fill(x, y)));
}
