import { HexTile } from "core/overworld/hexTile";
import { lineage, Species } from "core/species";
import { GameResult } from "game/gameResult";
import { populateGeneOptions } from "game/ui/SpeciesViewer/generateRandomGenes";
import produce from "immer";
import React, { useContext } from "react";
import { AppState, PopulationAttempt } from "./state";

type AppReducerContextType = [AppState, React.Dispatch<AppActions>];

export const AppReducerContext = React.createContext<AppReducerContextType>(null!);

export function useAppReducer(): AppReducerContextType {
  return useContext(AppReducerContext);
}

export function reducer(state: AppState, action: AppActions): AppState {
  if (action == null) {
    console.error("can't reduce null action!", state, action);
    return state;
  }
  switch (action.type) {
    // a dummy trigger on species mutate
    case "AAUpdateSpecies":
      return handleUpdateSpecies(state, action);
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
    case "AATransitionStart":
      return handleTransitionStart(state, action);
    case "AATransitionEnd":
      // no-op; this must be handled in the middleware
      return state;
    // return handleTransitionEnd(state, action);
  }
}

export type AppActions =
  | AAUpdateSpecies
  | AAStartPopulationAttempt
  | AAPopulationAttemptSuccess
  | AANextEpoch
  | AAGetGameResult
  | AAGameResultDone
  | AATransitionStart
  | AATransitionEnd;

export interface AAUpdateSpecies {
  type: "AAUpdateSpecies";
  species?: Species;
}

function handleUpdateSpecies(state: AppState, action: AAUpdateSpecies): AppState {
  if (action.species) {
    return {
      ...state,
      rootSpecies: action.species,
    };
    // return produce(state, (draft) => {
    //   const newSpecies = action.species!;
    //   findAndSetSpeciesRecursive(draft.rootSpecies, newSpecies);
    // });
  } else {
    return { ...state };
  }
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
  return produce(state, (draft: AppState) => {
    const { attempt = draft.activePopulationAttempt!, results } = action;
    const { settlingSpecies } = attempt;

    // cannot access target hex directly since it points to the old state, must use the draft
    const targetHex = draft.overWorld.hexAt(attempt.targetHex.i, attempt.targetHex.j)!;

    const isFirstPlaythrough = attempt.sourceHex == null;
    if (isFirstPlaythrough) {
      gtag("event", "Beat first playthrough", { label: "mp earned", value: results.mutationPointsPerEpoch });
    }

    // populate target hex
    let oldSpecies: Species | undefined = undefined;
    if (targetHex.info.flora != null) {
      oldSpecies = targetHex.info.flora.species;
    }
    targetHex.info.flora = {
      species: settlingSpecies,
      mutationPointsPerEpoch: results.mutationPointsPerEpoch,
    };

    if (oldSpecies) {
      // update old species mutation point pool cache
      oldSpecies.freeMutationPoints = Math.min(
        oldSpecies.freeMutationPoints,
        draft.overWorld.getMaxGenePool(oldSpecies)
      );
    }

    // bump visibility
    for (const n of draft.overWorld.hexNeighbors(targetHex)) {
      n && (n.info.visible = true);
    }
  });
}

export interface AANextEpoch {
  type: "AANextEpoch";
}

function handleNextEpoch(state: AppState, action: AANextEpoch): AppState {
  return produce(state, (draft) => {
    // +1 epoch:
    // reset all species pools to max
    for (const species of lineage(draft.rootSpecies)) {
      species.freeMutationPoints = draft.overWorld.getMaxGenePool(species);
      if (species.freeMutationPoints > 0) {
        // on the very first time you move an epoch, you get one chance to get transport/pipes/diffuse water
        const isFirstChoice = draft.epoch === 0;
        species.geneOptions = populateGeneOptions(species, isFirstChoice);
      }
    }
    draft.epoch += 1;
  });
}

export interface AAGetGameResult {
  type: "AAGetGameResult";
  result: GameResult;
}

function handleGetGameResult(state: AppState, action: AAGetGameResult): AppState {
  // if (state.activePopulationAttempt == null) {
  //   throw new Error("activePopulationAttempt shouldn't be null during handleWinLoss");
  // }
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
  const { activeGameResult } = state;
  const activePopulationAttempt = state.activePopulationAttempt!;
  // lost the tutorial level
  if (activeGameResult?.status === "lost" && activePopulationAttempt.sourceHex == null) {
    return {
      ...state,
      activeGameResult: undefined,
      // shallow clone; re-creates the level
      activePopulationAttempt: {
        ...activePopulationAttempt,
      },
    };
  }
  return {
    ...state,
    activePopulationAttempt: undefined,
    activeGameResult: undefined,
  };
}

export interface AATransitionStart {
  type: "AATransitionStart";
  transition: AppActions;
}

function handleTransitionStart(state: AppState, action: AATransitionStart): AppState {
  return {
    ...state,
    transition: action.transition,
  };
}

export interface AATransitionEnd {
  type: "AATransitionEnd";
}
