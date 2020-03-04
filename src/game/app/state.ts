import { GameResult } from "game/gameResult";
import { createSimpleSchema, object, reference } from "serializr";
import { HexTile } from "../../core/overworld/hexTile";
import { OverWorld } from "../../core/overworld/overWorld";
import { Species, SpeciesSchema } from "../../core/species";
import { AppActions } from "./reducer";

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
  transition?: AppActions;
}

export interface PopulationAttempt {
  sourceHex?: HexTile;
  targetHex: HexTile;
  settlingSpecies: Species;
}

const PopulationAttemptSchema = createSimpleSchema<PopulationAttempt>({
  sourceHex: reference(HexTile),
  targetHex: reference(HexTile),
  settlingSpecies: reference(SpeciesSchema),
});

export const AppStateSchema = createSimpleSchema<AppState>({
  overWorld: object(OverWorld),
  // no active population attempt
  // activePopulationAttempt: object(PopulationAttemptSchema),
  // no activeGameResult
  rootSpecies: object(SpeciesSchema),
  epoch: true,
});
