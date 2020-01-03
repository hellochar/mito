import { Button } from "common/Button";
import * as React from "react";
import Mito from "..";

const Debug: React.FC<{ mito: Mito }> = ({ mito }) => {
  const doWin = React.useCallback(() => {
    mito.onWinLoss({
      ...mito.world.wipResult,
      status: "won",
      mutationPointsPerEpoch: 2,
    });
  }, [mito]);

  const doLose = React.useCallback(() => {
    mito.onWinLoss({
      ...mito.world.wipResult,
      status: "lost",
      mutationPointsPerEpoch: 0,
    });
  }, [mito]);

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0 }}>
      <div style={{ display: "flex" }}>
        <Button color="green" onClick={doWin}>
          Win
        </Button>
        <Button color="green" onClick={doLose}>
          Lose
        </Button>
      </div>
      <div style={{ background: "white" }}>
        <div>Rainwater: {mito.world.numRainWater}</div>
        <div>Evaporated Air: {mito.world.numEvaporatedAir}</div>
        <div>Evaporated Soil: {mito.world.numEvaporatedSoil}</div>
      </div>
    </div>
  );
};

export default Debug;
