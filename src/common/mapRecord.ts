export default function mapRecord<K extends string, I, O>(obj: Record<K, I>, fn: (val: I, key: K) => O): Record<K, O> {
  const out = {} as Record<K, O>;
  let key: K;
  for (key in obj) {
    const val = obj[key];
    out[key] = fn(val, key);
  }
  return out;
}
