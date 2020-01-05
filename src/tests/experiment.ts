import { World } from "sketches/mito/game";
import { Tile } from "sketches/mito/game/tile";

export type Visitor = (tiles: Tile[], arg0: any) => number;

export interface Visitors {
  [name: string]: Visitor;
}

export function visit(arg0: World | Tile[], visitors: Visitors): Trial {
  const tiles = arg0 instanceof World ? Array.from(arg0.allEnvironmentTiles()) : arg0;
  const results: Trial = {};
  for (const [name, visitor] of Object.entries(visitors)) {
    const result = visitor(tiles, arg0);
    results[name] = result;
  }
  return results;
}

export interface Trial {
  [key: string]: number;
}

export class Experiment {
  trials: Trial[] = [];
  constructor(public visitors: Visitors) {}
  recordDataFor(world: World) {
    const trial = visit(world, this.visitors);
    this.trials.push(trial);
  }
  visitorNames() {
    return Object.keys(this.visitors);
  }
}

export class ExperimentSuite {
  constructor(public experiments: Experiment[]) {}

  recordDataFor(world: World) {
    for (const e of this.experiments) {
      e.recordDataFor(world);
    }
  }
}
