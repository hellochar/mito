export default function configure<T>(obj: T, callback: (obj: T) => void): T {
  callback(obj);
  return obj;
}
