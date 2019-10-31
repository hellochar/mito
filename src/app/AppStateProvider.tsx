import { newBaseSpecies } from "evolution/species";
import { OverWorld } from "overworld/overWorld";
import React from "react";
import { AppReducerContext, reducer } from "./reducer";
import { AppState } from "./state";

export interface AppStateProviderProps {
  children: React.ReactNode;
}

export default function AppStateProvider({ children }: AppStateProviderProps) {
  const stateDispatchTuple = React.useReducer(reducer, newInitialAppState());
  return (
    <AppReducerContext.Provider value={stateDispatchTuple}>
      {children}
    </AppReducerContext.Provider>
  );
}

export function newInitialAppState(): AppState {
  const overWorld = OverWorld.generateRectangle(100, 50);
  const rootSpecies = newBaseSpecies("plantum originus");
  // const activeLevel = overWorld.getStartTile();
  // rootSpecies.freeMutationPoints = 25;
  // const s3 = newBaseSpecies("s3");
  // s3.descendants = [newBaseSpecies("ya"), newBaseSpecies("no"), newBaseSpecies("whoa")];
  // let s: Species;
  // rootSpecies.descendants = [s = newBaseSpecies("foo"), newBaseSpecies("bar"), s3];
  // s.descendants = [newBaseSpecies("1"), newBaseSpecies("2")]
  return {
    overWorld,
    rootSpecies,
    epoch: 0,
  };
}
