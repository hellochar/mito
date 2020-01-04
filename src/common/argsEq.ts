import { Vector2 } from "three";

/**
 * Accounts for:
 * strict equality
 * null
 * Vector2
 * Arrays are recursively argsEq-ed
 */
export default function argsEq(args1: any, args2: any) {
  if (args1 === args2) {
    return true;
  }
  if (typeof args1 !== typeof args2) {
    return false;
  }
  if (args1 == null && args2 == null) {
    return true;
  }
  if (args1 instanceof Vector2 && args2 instanceof Vector2) {
    return args1.equals(args2);
  }
  if (args1 instanceof Array && args2 instanceof Array) {
    const allEq = args1.every((_, index) => argsEq(args1[index], args2[index]));
    return allEq;
  }
}
