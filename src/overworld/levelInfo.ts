import { createSimpleSchema, object, primitive, reference } from "serializr";
import { Species, SpeciesSchema } from "../evolution/species";
import { Environment, EnvironmentSchema } from "../sketches/mito/game/environment";

export interface LevelInfo {
  height: number; // [-1 to 6], integers only
  temperature?: "cold" | "temperate" | "hot";
  rainfall?: "low" | "medium" | "high";
  soilType?: "barren" | "average" | "fertile";
  wind?: "low" | "medium" | "high";
  visible: boolean;
  environment?: Environment;
  flora?: {
    species: Species;
    mutationPointsPerEpoch: number;
    actionPoints: number;
  };
}

export const LevelInfoSchema = createSimpleSchema<LevelInfo>({
  // "*": true,
  height: primitive(),
  temperature: primitive(),
  rainfall: primitive(),
  soilType: primitive(),
  wind: primitive(),
  visible: primitive(),
  environment: object(EnvironmentSchema),

  flora: object(
    createSimpleSchema({
      species: reference(SpeciesSchema),
      mutationPointsPerEpoch: primitive(),
      actionPoints: primitive(),
    })
  ),
});
