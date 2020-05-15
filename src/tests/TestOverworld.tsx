import { OverWorld } from "core/overworld/overWorld";
import { newBaseSpecies } from "core/species";
import { AppState } from "game/app";
import { AppStateProvider } from "game/app/AppStateProvider";
import { OverWorldMap } from "game/ui/overworld/map/OverWorldMap";
import React, { useCallback, useMemo, useState } from "react";

export function newInitialAppState(): AppState {
  const overWorld = OverWorld.generateLargeContinent(23);
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

function TestOverworld() {
  const [count, setCount] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const appState = useMemo(() => newInitialAppState(), [count]);
  const nextSeed = useCallback(() => setCount((s) => s + 1), []);
  return (
    <>
      <button onClick={nextSeed} style={{ zIndex: 1, position: "absolute", left: 0, top: 0 }}>
        {count}
      </button>
      <AppStateProvider key={count} appState={appState}>
        <OverWorldMap key={count} />
      </AppStateProvider>
    </>
  );
}

export default TestOverworld;
