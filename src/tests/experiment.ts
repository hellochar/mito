import { World } from "sketches/mito/game";
import { Tile } from "sketches/mito/game/tile";

export type Visitor = (tiles: Tile[], world: World) => number;

export interface Visitors {
  [name: string]: Visitor;
}

export function visit(tiles: Tile[], visitors: Visitors): Trial {
  const results: Trial = {};
  for (const [name, visitor] of Object.entries(visitors)) {
    const result = visitor(tiles, tiles[0].world);
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

  recordDataFor(tiles: Tile[]) {
    const trial = visit(tiles, this.visitors);
    this.trials.push(trial);
  }

  visitorNames() {
    return Object.keys(this.visitors);
  }
}

export class ExperimentSuite {
  constructor(public experiments: Experiment[]) {}

  recordDataFor(tiles: Tile[]) {
    for (const e of this.experiments) {
      e.recordDataFor(tiles);
    }
  }
}
