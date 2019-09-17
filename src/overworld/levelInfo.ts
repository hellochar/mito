import { Environment } from "../sketches/mito/game/environment";

import { World } from "../sketches/mito/game";

export interface LevelInfo {
    height: number; // [-1 to 6], integers only
    temperature?: "cold" | "temperate" | "hot";
    rainfall?: "low" | "medium" | "high";
    soilType?: "barren" | "average" | "fertile";
    wind?: "low" | "medium" | "high";

    conquered: boolean;
    visible: boolean;
    environment?: Environment;
    world?: World;
}
