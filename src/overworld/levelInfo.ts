import { Species } from "../evolution/species";
import { Environment } from "../sketches/mito/game/environment";


export interface LevelInfo {
  height: number; // [-1 to 6], integers only
  temperature?: "cold" | "temperate" | "hot";
  rainfall?: "low" | "medium" | "high";
  soilType?: "barren" | "average" | "fertile";
  wind?: "low" | "medium" | "high";

  flora?: {
    species: Species;
    mutationPointsPerEpoch: number;
    actionPoints: number;
  };
  visible: boolean;
  environment?: Environment;
  // world?: World;
}
