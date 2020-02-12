import { World } from "../core";
import { Tile } from "../core/tile";

export function findBuildCandidateTiles(world: World, predicate?: (tile: Tile) => boolean) {
  const entityPredicate: (tile: Tile) => boolean = (t) => world.player.isWalkable(t);
  const candidates: Set<Tile> = new Set();
  for (const entity of world.entities()) {
    if (entity instanceof Tile && entityPredicate(entity)) {
      for (const [, neighbor] of world.tileNeighbors(entity.pos)) {
        if (world.player.canBuildAt(neighbor)) {
          if (predicate == null) {
            candidates.add(neighbor);
          } else if (predicate(neighbor)) {
            candidates.add(neighbor);
          }
        }
      }
    }
  }
  return candidates;
}
