import { Cell } from "../core/tile";
import { World } from "../core/world/world";
import Mito from "./mito/mito";

export interface GameResult {
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
  let anyCellsAlive = false || world.playerSeed != null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const cell of world.allCells()) {
    anyCellsAlive = true;
    break;
  }
  // const isStandingOnDeadCell = this.tileAt(this.player.pos.x, this.player.pos.y) instanceof DeadCell;
  // const isTimePastOneYear = this.time >= TIME_PER_YEAR;
  // const shouldGameEnd = isStandingOnDeadCell;
  const shouldGameEnd = !anyCellsAlive;
  if (!shouldGameEnd) {
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
    mutationPointsPerEpoch: matureEarners.map(([, mp]) => mp).reduce((a, b) => a + b, 0),
    status: shouldWin ? "won" : "lost",
    vignettes,
    world,
  };
}
