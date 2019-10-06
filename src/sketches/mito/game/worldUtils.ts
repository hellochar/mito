import { World } from ".";

import { Tile, Tissue } from "./tile";

export function findBuildCandidateTiles(world: World, predicate?: (tile: Tile) => boolean) {
  const entityPredicate: (tile: Tile) => boolean = (t) => world.player.isWalkable(t);
  const candidates: Set<Tile> = new Set();
  for (const entity of world.entities()) {
    if (entity instanceof Tile && entityPredicate(entity)) {
      for (const [, neighbor] of world.tileNeighbors(entity.pos)) {
        if (!(neighbor instanceof Tissue) && !neighbor.isObstacle) {
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
