const cache: Map<string, Intl.NumberFormat> = new Map();
export function nf(n: number, maximumSignificantDigits: number = 3, minimumSignificantDigits?: number) {
  const key = `${minimumSignificantDigits},${maximumSignificantDigits}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      new Intl.NumberFormat(undefined, {
        maximumSignificantDigits,
        minimumSignificantDigits,
        useGrouping: true,
      })
    );
  }
  return cache.get(key)!.format(n);
}
