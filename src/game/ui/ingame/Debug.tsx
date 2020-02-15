import { Button } from "game/ui/common/Button";
import * as React from "react";
import Keyboard from "../../input/keyboard";
import Mito from "../../mito/mito";
import PlantStats from "./PlantStats";

const Debug: React.FC<{ mito: Mito }> = ({ mito }) => {
  const doWin = React.useCallback(() => {
    mito.onWinLoss({
      mpEarners: mito.world.mpEarners,
      world: mito.world,
      status: "won",
      mutationPointsPerEpoch: 2,
    });
  }, [mito]);

  const doLose = React.useCallback(() => {
    mito.onWinLoss({
      mpEarners: mito.world.mpEarners,
      world: mito.world,
      status: "lost",
      mutationPointsPerEpoch: 0,
    });
  }, [mito]);

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, background: "white" }}>
      <div style={{ display: "flex" }}>
        <Button color="green" onClick={doWin}>
          Win
        </Button>
        <Button color="green" onClick={doLose}>
          Lose
        </Button>
      </div>
      <PlantStats world={mito.world} time={Math.floor(mito.world.time)} />
      <div>
        <div>Rainwater: {mito.world.numRainWater}</div>
        <div>Evaporated Air: {mito.world.numEvaporatedAir}</div>
        <div>Evaporated Soil: {mito.world.numEvaporatedSoil}</div>
      </div>
      <div style={{ background: "white" }}>{Array.from(Keyboard.keyMap.values()).join(", ")}</div>
    </div>
  );
};

export default Debug;
