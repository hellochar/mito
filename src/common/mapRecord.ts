export default function mapRecord<O, R>(obj: O, fn: (val: O[keyof O], key: keyof O) => R): Record<keyof O, R> {
  const out = {} as Record<keyof O, R>;
  let key: keyof O;
  for (key in obj) {
    const val = obj[key];
    out[key] = fn(val, key);
  }
  return out;
}
