import { Player } from "./player";
import { Tile } from "./tile";

export type Entity = Tile | Player;

export interface Steppable {
  step(): void;
}

export class StopStep extends Error { }

export function isSteppable(obj: any): obj is Steppable {
  return typeof obj.step === "function";
}

export function step(s: Steppable) {
  try {
    s.step();
  } catch (e) {
    if (e instanceof StopStep) {
      // no-op for exiting early
    } else {
      throw e;
    }
  }
}
