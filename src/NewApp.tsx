import { Species, newBaseSpecies } from "evolution/species";
import { HexTile } from "overworld/hexTile";
import { GameResult } from "sketches/mito";
import { OverWorld } from "overworld/overWorld";
import React, { useContext } from "react";

interface AppActionNewSpecies {
  type: "AANewSpecies";
  species: Species;
}
interface AppActionStartPlayLevel {
  type: "AAStartPlayLevel";
  level: HexTile;
  species: Species;
}

interface AppActionFinishLevel {
  type: "AAFinishLevel";
  level: HexTile;
  species: Species;
  result: GameResult;
}

type AppActions = AppActionNewSpecies | AppActionStartPlayLevel | AppActionFinishLevel;

interface NewAppState {
  species: Record<string, Species>;
  overWorld: OverWorld;
  epoch: number;
}

function reducer(state: NewAppState, action: AppActions): NewAppState {
  switch (action.type) {
    case "AANewSpecies":
      return {
        ...state,
        species: {
          ...state.species,
          [action.species.id]: action.species,
        },
      };
    case "AAFinishLevel":
      // TODO finish
      return {
        ...state,
      };
    case "AAStartPlayLevel":
      // TODO finish
      return {
        ...state,
      }
  }
}

type AppStateContextType = [NewAppState, React.Dispatch<AppActions>];

// TODO fix initial state
const AppStateContext = React.createContext<AppStateContextType>([null!, null!]);

export function useAppState(): AppStateContextType {
  return useContext(AppStateContext);
}

function NewApp({ children }: { children: React.ReactNode }) {
  const initialState = React.useMemo(() => {
    const s = {
      epoch: 0,
      overWorld: OverWorld.generateRectangle(50, 100),
      species: {}
    };
    return reducer(s, { type: "AANewSpecies", species: newBaseSpecies() });
  }, []);
  const [state, dispatch] = React.useReducer(reducer, initialState);
  return (
    <AppStateContext.Provider value={[state, dispatch]}>
      {children}
    </AppStateContext.Provider>
  );
}
