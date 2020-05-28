import { Cell } from "../core/tile";
import { World } from "../core/world/world";
import Mito from "./mito/mito";

export interface GameResult {
  oxygenContribution: number;
  status: "won" | "lost";
  mpEarners: Map<Cell, number>;
  /**
   * Computed - sum of mpEarners.
   */
  mutationPointsPerEpoch: number;
  world: World;
  vignettes?: HTMLCanvasElement[];
}

export function maybeGetGameResult(mito: Mito): GameResult | null {
  const { world } = mito;
  if (world.playerSeed != null) {
    return null;
  }
  let anyCellsAlive = false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const tile of world.bfsIterator(world.player.pos, world.width * world.height)) {
    if (Cell.is(tile)) {
      anyCellsAlive = true;
      break;
    }
  }
  // const isStandingOnDeadCell = this.tileAt(this.player.pos.x, this.player.pos.y) instanceof DeadCell;
  // const isTimePastOneYear = this.time >= TIME_PER_YEAR;
  // const shouldGameEnd = isStandingOnDeadCell;
  if (anyCellsAlive) {
    return null;
  }

  // make a decision
  return getDecidedGameResult(mito);
}

export function getDecidedGameResult(mito: Mito): GameResult {
  const { world, vignettes } = mito;
  const matureEarners = Array.from(world.mpEarners.entries()).filter(([f, mpEarned]) => mpEarned > 0);
  const shouldWin = matureEarners.length > 0;

  return {
    mpEarners: world.mpEarners,
    oxygenContribution: world.oxygenPerSecond,
    mutationPointsPerEpoch: matureEarners.map(([, mp]) => mp).reduce((a, b) => a + b, 0),
    status: shouldWin ? "won" : "lost",
    vignettes,
    world,
  };
}
