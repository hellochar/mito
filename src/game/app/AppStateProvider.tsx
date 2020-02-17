import { sleep } from "common/promise";
import { OverWorld } from "core/overworld/overWorld";
import { newBaseSpecies } from "core/species";
import React, { useEffect } from "react";
import { AATransitionEnd, AppActions, AppReducerContext, reducer } from "./reducer";
import { load, saveOnActionMiddleware } from "./saveLoad";
import { AppState } from "./state";

export interface AppStateProviderProps {
  children: React.ReactNode;
  appState: AppState;
}

// when a TransitionStart action happens, automatically trigger a TransitionEnd
// after millis
export function autoTransitionEndDispatchMiddleware(dispatch: React.Dispatch<AppActions>, millis = 2000) {
  const newDispatch: React.Dispatch<AppActions> = (action: AppActions) => {
    dispatch(action);
    if (action.type === "AATransitionStart") {
      sleep(millis).then(() => {
        dispatch({ type: "AATransitionEnd" });
      });
    }
  };
  return newDispatch;
}

export function handleTransitionEndMiddleware(
  reducer: React.Reducer<AppState, AppActions>
): React.Reducer<AppState, AppActions> {
  function handleTransitionEnd(state: AppState, action: AATransitionEnd): AppState {
    const { transition, ...stateWithoutTransition } = state;
    const newState = reducer(stateWithoutTransition, transition!);
    return newState;
  }

  return (state, action) => {
    if (action.type === "AATransitionEnd") {
      return handleTransitionEnd(state, action);
    } else {
      return reducer(state, action);
    }
  };
}

export function AppStateProvider({ children, appState }: AppStateProviderProps) {
  const reducerWithMiddleware = React.useMemo(() => handleTransitionEndMiddleware(saveOnActionMiddleware(reducer)), []);
  const [state, dispatchRaw] = React.useReducer(reducerWithMiddleware, appState);
  const dispatch = React.useMemo(() => autoTransitionEndDispatchMiddleware(dispatchRaw), []);
  const reducerTuple = React.useMemo(() => [state, dispatch] as [AppState, React.Dispatch<AppActions>], [
    state,
    dispatch,
  ]);
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
        if (appState) setState(appState);
      })
      .catch(() => {
        console.log("couldn't load appState from localForage; resetting game");
        setState(newInitialAppState());
      });
  }, []);

  return state == null ? loadingComponent : <AppStateProvider appState={state}>{children}</AppStateProvider>;
};

export function newInitialAppState(): AppState {
  const overWorld = OverWorld.generateRectangle(100, 50);
  const rootSpecies = newBaseSpecies("plantum originus");
  const startHex = overWorld.getStartHex();
  // rootSpecies.freeMutationPoints = 25;
  // const s3 = newBaseSpecies("s3");
  // s3.descendants = [newBaseSpecies("ya"), newBaseSpecies("no"), newBaseSpecies("whoa")];
  // let s: Species;
  // rootSpecies.descendants = [s = newBaseSpecies("foo"), newBaseSpecies("bar"), s3];
  // s.descendants = [newBaseSpecies("1"), newBaseSpecies("2")]
  return {
    overWorld,
    rootSpecies,
    activePopulationAttempt: {
      settlingSpecies: rootSpecies,
      targetHex: startHex,
    },
    epoch: 0,
  };
}
