function filterObject<T>(obj: Record<string, T>, cb: (val: T, key: string) => boolean) {
  const newObj: Record<string, T> = {};
  for (const key in obj) {
    if (cb(obj[key], key)) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

export default filterObject;
