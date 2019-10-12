declare module "string.prototype.matchall" {
  function matchAll(s: string, r: string | RegExp): Array<RegExpMatchArray> | null;
  export default matchAll;
}
