import { Player, PlayerSeed } from "../sketches/mito/game/player";
import { Tile } from "../sketches/mito/game/tile";

export type Entity = Tile | Player | PlayerSeed;

export interface Steppable {
  dtSinceLastStepped: number;
  shouldStep(dt: number): boolean;
  step(dt: number): void;
}

export class StopStep extends Error {}

export function isSteppable(obj: any): obj is Steppable {
  return typeof obj.step === "function";
}

export function step(s: Steppable, dt: number) {
  const sDt = s.dtSinceLastStepped + dt;
  if (s.shouldStep(sDt)) {
    try {
      s.step(sDt);
    } catch (e) {
      if (e instanceof StopStep) {
        // no-op for exiting early
      } else {
        throw e;
      }
    } finally {
      s.dtSinceLastStepped = 0;
    }
  } else {
    s.dtSinceLastStepped = sDt;
  }
}
