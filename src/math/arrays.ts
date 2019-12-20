export function arrayRange<T = number>(length: number, fill?: T) {
  return new Array(length).fill(undefined).map((_, i) => (fill !== undefined ? fill : i));
}
