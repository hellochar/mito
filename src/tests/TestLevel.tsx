import { HexTile } from "core/overworld/hexTile";
import { newBaseSpecies } from "core/species";
import { PopulationAttempt } from "game/app";
import { params } from "game/params";
import MitoScreen from "game/screens/MitoScreen";
import React, { useCallback, useEffect, useState } from "react";

function newHexWithSeed(seed: number) {
  const hex = new HexTile(0, 0);
  hex.info.height = 4;
  hex.info.seed = seed;
  return hex;
}

function TestLevel() {
  useEffect(() => {
    params.debugLevel = true;
    params.hud = false;
  }, []);
  const [attempt, setAttempt] = useState<PopulationAttempt>({
    settlingSpecies: newBaseSpecies(),
    targetHex: newHexWithSeed(0),
  });
  const nextSeed = useCallback(() => {
    setAttempt((attempt: PopulationAttempt) => {
      return {
        settlingSpecies: attempt.settlingSpecies,
        targetHex: newHexWithSeed(attempt.targetHex.info.seed + 1),
      };
    });
  }, []);
  return (
    <>
      <button onClick={nextSeed} style={{ zIndex: 1, position: "absolute", left: 0, top: 0 }}>
        Seed {attempt.targetHex.info.seed}
      </button>
      <MitoScreen key={attempt.targetHex.info.seed} attempt={attempt} onWinLoss={() => {}} />
    </>
  );
}

export default TestLevel;
