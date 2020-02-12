import { createSimpleSchema, object, primitive, reference } from "serializr";
import { EnvironmentSchema } from "../../sketches/mito/game/environment";
import { Species, SpeciesSchema } from "../species";

export interface LevelInfo {
  seed: number;
  height: number; // [-1 to 6], integers only
  temperature: "cold" | "temperate" | "hot";
  rainfall: "low" | "medium" | "high";
  soilType: "barren" | "average" | "fertile";
  // wind: "low" | "medium" | "high";
  visible: boolean;
  flora?: {
    species: Species;
    mutationPointsPerEpoch: number;
  };
}

export const LevelInfoSchema = createSimpleSchema<LevelInfo>({
  // "*": true,
  seed: primitive(),
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