import { newBaseSpecies } from "evolution/species";
import { OverWorld } from "overworld/overWorld";
import React, { useEffect } from "react";
import { AppReducerContext, reducer } from "./reducer";
import { load, saveOnActionMiddleware } from "./saveLoad";
import { AppState } from "./state";

export interface AppStateProviderProps {
  children: React.ReactNode;
  appState: AppState;
}

export function AppStateProvider({ children, appState }: AppStateProviderProps) {
  const reducerWithMiddleware = React.useMemo(() => saveOnActionMiddleware(reducer), []);
  const reducerTuple = React.useReducer(reducerWithMiddleware, appState);
  return <AppReducerContext.Provider value={reducerTuple}>{children}</AppReducerContext.Provider>;
}

export const LocalForageStateProvider: React.FC<{ loadingComponent: JSX.Element }> = ({
  children,
  loadingComponent = null,
}) => {
  const [state, setState] = React.useState<AppState | null>(null);
  useEffect(() => {
    load()
      .then((appState) => {
        console.log("loaded", appState);
        if (appState) setState(appState);
      })
      .catch(() => {
        console.log("caught");
        setState(newInitialAppState());
      });
  }, []);

  return state == null ? loadingComponent : <AppStateProvider appState={state}>{children}</AppStateProvider>;
};

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
