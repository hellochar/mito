import React from "react";

import { OverWorld } from "./overworld/overWorld";
import { HexTile } from "./overworld/hexTile";
import { GameResult } from "./sketches/mito";
import { Species, newBaseSpecies } from "./evolution/species";

export interface AppState {
  overWorld: OverWorld;
  activeLevel?: HexTile;
  activeGameResult?: GameResult;
  rootSpecies: Species;
}

const overWorld = OverWorld.generateRectangle(100, 50);
const activeLevel = overWorld.getStartTile();
const rootSpecies = newBaseSpecies();
rootSpecies.name = "plantum originus";

const DEFAULT_APP_STATE: AppState = {
  overWorld,
  activeLevel,
  rootSpecies,
};

const AppContext = React.createContext<AppState>(DEFAULT_APP_STATE);

export default AppContext;
