import localforage from "localforage";
import { deserialize, serialize } from "serializr";
import { AppActions } from "./reducer";
import { AppState, AppStateSchema } from "./state";

const GAME_DATA_KEY = "gameData";

export function save(appState: AppState) {
  const json = serialize(AppStateSchema, appState);
  const stringToSave = JSON.stringify(json);
  return localforage.setItem(GAME_DATA_KEY, stringToSave);
}

export async function load(): Promise<AppState> {
  const string = await localforage.getItem<string>(GAME_DATA_KEY);
  const json = JSON.parse(string);
  const appState = deserialize(AppStateSchema, json);
  return appState;
}

export function resetGame() {
  const confirm = window.confirm("Are you sure you want to reset your whole game?");
  if (confirm) {
    return localforage.removeItem(GAME_DATA_KEY).then(() => {
      window.location.reload();
    });
  } else {
    return Promise.reject();
  }
}

const ACTIONS_TO_SAVE_ON: Partial<Record<AppActions["type"], true>> = {
  "AAGameResultDone": true,
  "AAGetGameResult": true,
  "AANewSpecies": true,
  "AANextEpoch": true,
  "AAPopulationAttemptSuccess": true,
  "AAStartPopulationAttempt": true,
};

export function saveOnActionMiddleware(reducer: React.Reducer<AppState, AppActions>) {
  console.log("new reducer made");
  return (state: AppState, action: AppActions) => {
    const newState = reducer(state, action);
    if (ACTIONS_TO_SAVE_ON.hasOwnProperty(action.type)) {
      console.log("saved from", action);
      save(newState);
    }
    return newState;
  }
}
