import { Species } from "../evolution/species";
import { HexTile } from "../overworld/hexTile";
import { OverWorld } from "../overworld/overWorld";
import { GameResult } from "../sketches/mito";

/**
 * For now, we mutate classes and manually call dummy placeholder
 * actions to get a state update.
 */
export interface AppState {
  overWorld: OverWorld;
  /**
   * Determines whether we're in the game or in the overworld.
   *
   * Null activeLevel means we're in overworld.
   * Non-null means we're in-game, or in the game results screen.
   */
  activePopulationAttempt?: PopulationAttempt;
  /**
   * Determines whether to show the game over screen. While non-null,
   * we show a game result screen.
   */
  activeGameResult?: GameResult;
  rootSpecies: Species;
  // species: Record<string, Species>;
  epoch: number;
}

export interface PopulationAttempt {
  sourceHex?: HexTile;
  targetHex: HexTile;
  settlingSpecies: Species;
}
