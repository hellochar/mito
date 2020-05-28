import { Button } from "game/ui/common/Button";
import * as React from "react";
import Keyboard from "../../input/keyboard";
import Mito from "../../mito/mito";
import { ResourceIcon } from "../common/ResourceIcon";
import PlantStats from "./PlantStats";

const Debug: React.FC<{ mito: Mito }> = ({ mito }) => {
  const doWin = React.useCallback(() => {
    mito.onWinLoss({
      mpEarners: mito.world.mpEarners,
      world: mito.world,
      status: "won",
      oxygenContribution: mito.world.oxygenPerSecond,
      mutationPointsPerEpoch: 1,
      vignettes: mito.vignettes,
    });
  }, [mito]);

  const doLose = React.useCallback(() => {
    mito.onWinLoss({
      oxygenContribution: 0,
      mpEarners: mito.world.mpEarners,
      world: mito.world,
      status: "lost",
      mutationPointsPerEpoch: 0,
      vignettes: mito.vignettes,
    });
  }, [mito]);

  const plusWater = React.useCallback(() => {
    mito.world.player.inventory.add(5, 0);
  }, [mito.world.player.inventory]);

  const plusSugar = React.useCallback(() => {
    mito.world.player.inventory.add(0, 5);
  }, [mito.world.player.inventory]);

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
      <div style={{ display: "flex" }}>
        <Button onClick={plusWater}>
          +5 <ResourceIcon name="water" />
        </Button>
        <Button onClick={plusSugar}>
          +5 <ResourceIcon name="sugar" />
        </Button>
      </div>
      <PlantStats world={mito.world} time={Math.floor(mito.world.time)} />
      <div>
        <div>Rainwater: {mito.world.numRainWater}</div>
        <div>Recharged water: {mito.world.numRechargedWater}</div>
        <div>Evaporated Air: {mito.world.numEvaporatedAir}</div>
        <div>Evaporated Soil: {mito.world.numEvaporatedSoil}</div>
      </div>
      <div style={{ background: "white" }}>{Array.from(Keyboard.keyMap.values()).join(", ")}</div>
    </div>
  );
};

export default Debug;
