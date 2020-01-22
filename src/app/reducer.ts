import { lineage, Species } from "evolution/species";
import { HexTile } from "overworld/hexTile";
import React, { useContext } from "react";
import { GameResult } from "sketches/mito";
import { AppState, PopulationAttempt } from "./state";

type AppReducerContextType = [AppState, React.Dispatch<AppActions>];

export const AppReducerContext = React.createContext<AppReducerContextType>(null!);

export function useAppReducer(): AppReducerContextType {
  return useContext(AppReducerContext);
}

export function reducer(state: AppState, action: AppActions): AppState {
  switch (action.type) {
    case "AAUpdateSpecies":
      return {
        ...state,
        // species: {
        //   ...state.species,
        //   [action.species.id]: action.species,
        // },
      };
    case "AAStartPopulationAttempt":
      return handleStartPopulationAttempt(state, action);
    case "AAPopulationAttemptSuccess":
      return handlePopulationAttemptSuccess(state, action);
    case "AANextEpoch":
      return handleNextEpoch(state, action);
    case "AAGetGameResult":
      return handleGetGameResult(state, action);
    case "AAGameResultDone":
      return handleGameResultDone(state, action);
  }
}

export type AppActions =
  | AAUpdateSpecies
  | AAStartPopulationAttempt
  | AAPopulationAttemptSuccess
  | AANextEpoch
  | AAGetGameResult
  | AAGameResultDone;

export interface AAUpdateSpecies {
  type: "AAUpdateSpecies";
  species: Species;
}

export interface AAStartPopulationAttempt {
  type: "AAStartPopulationAttempt";
  populationAttempt: PopulationAttempt;
}

function handleStartPopulationAttempt(state: AppState, action: AAStartPopulationAttempt): AppState {
  const populationAttempt = action.populationAttempt;
  const { targetHex, sourceHex } = populationAttempt;

  if (!targetHex.info.visible) {
    return state;
  }
  if (sourceHex != null) {
    if (sourceHex.info.flora == null) {
      console.error("sourceHex isn't null but the flora is null");
      return state;
    }
  }

  return {
    ...state,
    activePopulationAttempt: action.populationAttempt,
  };
}

export interface AAFinishLevel {
  type: "AAFinishLevel";
  level: HexTile;
  species: Species;
  result: GameResult;
}

export interface AAPopulationAttemptSuccess {
  type: "AAPopulationAttemptSuccess";
  attempt?: PopulationAttempt;
  results: GameResult;
}

function handlePopulationAttemptSuccess(state: AppState, action: AAPopulationAttemptSuccess): AppState {
  const { attempt = state.activePopulationAttempt!, results } = action;
  const { targetHex, settlingSpecies } = attempt;

  // populate target hex
  let oldSpecies: Species | undefined = undefined;
  if (targetHex.info.flora != null) {
    oldSpecies = targetHex.info.flora.species;
  }
  targetHex.info.flora = {
    species: settlingSpecies,
    mutationPointsPerEpoch: results.mutationPointsPerEpoch,
  };
  settlingSpecies.totalMutationPoints = state.overWorld.getMaxGenePool(settlingSpecies);
  if (oldSpecies) {
    // update old species mutation point pool cache
    oldSpecies.totalMutationPoints = state.overWorld.getMaxGenePool(oldSpecies);
  }

  // bump visibility
  for (const n of state.overWorld.hexNeighbors(targetHex)) {
    n.info.visible = true;
  }

  // things we changed:
  // sourceHex
  // targetHex
  // oldSpecies
  // settlingSpecies
  // targetHex.neighbors
  return { ...state };
}

export interface AANextEpoch {
  type: "AANextEpoch";
}

function handleNextEpoch(state: AppState, action: AANextEpoch): AppState {
  // +1 epoch:
  // reset all species pools to max
  for (const species of lineage(state.rootSpecies)) {
    species.freeMutationPoints = species.totalMutationPoints;
  }
  return {
    ...state,
    epoch: state.epoch + 1,
  };
}

export interface AAGetGameResult {
  type: "AAGetGameResult";
  result: GameResult;
}

function handleGetGameResult(state: AppState, action: AAGetGameResult): AppState {
  if (state.activePopulationAttempt == null) {
    throw new Error("activePopulationAttempt shouldn't be null during handleWinLoss");
  }
  if (action.result.status === "won") {
    state = handlePopulationAttemptSuccess(state, {
      type: "AAPopulationAttemptSuccess",
      attempt: state.activePopulationAttempt,
      results: action.result,
    });
  }
  return {
    ...state,
    activeGameResult: action.result,
  };
}

export interface AAGameResultDone {
  type: "AAGameResultDone";
}

function handleGameResultDone(state: AppState, action: AAGameResultDone): AppState {
  return {
    ...state,
    activePopulationAttempt: undefined,
    activeGameResult: undefined,
  };
}
