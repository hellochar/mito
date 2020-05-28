import { Intent, Overlay, ProgressBar } from "@blueprintjs/core";
import classNames from "classnames";
import { nf } from "common/formatters";
import { sleep } from "common/promise";
import { lineage, Species } from "core/species";
import { useAppReducer } from "game/app";
import { resetGame, save } from "game/app/saveLoad";
import { mitoOverworld } from "game/audio";
import { Button } from "game/ui/common/Button";
import PhylogeneticTree from "game/ui/overworld/PhylogeneticTree";
import { map } from "math";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GiFamilyTree } from "react-icons/gi";
import { HexTile } from "../../core/overworld/hexTile";
import { EpochUI } from "../ui/overworld/EpochUI";
import { OverWorldMap } from "../ui/overworld/map/OverWorldMap";
import SpeciesViewer from "../ui/SpeciesViewer";
import "./OverWorldScreen.scss";

export interface OverWorldScreenProps {
  onNextEpoch: () => void;
}

const OverWorldScreen = React.memo(({ onNextEpoch }: OverWorldScreenProps) => {
  useEffect(() => {
    mitoOverworld.play();
    return () => {
      mitoOverworld.stop();
    };
  }, []);

  const [leftPanelOpen, setLeftPanelOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Tab") {
        setLeftPanelOpen((open) => !open);
        e.preventDefault();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [viewedSpecies, setViewedSpecies] = useState<string>();

  const handleStartMutate = useCallback((s: Species) => {
    setViewedSpecies(s.id);
  }, []);

  const [{ rootSpecies, epoch, overWorld }] = useAppReducer();

  const onMountEpoch = useRef(epoch);

  useEffect(() => {
    if (epoch !== onMountEpoch.current) {
      sleep(4500).then(() => {
        // TODO add a UI to let you mutate multiple species
        const speciesReadyToMutate = lineage(rootSpecies).filter((species) => species.freeMutationPoints > 0);
        setViewedSpecies(speciesReadyToMutate[0].id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epoch]);

  function maybeRenderPhylogeneticTreePanel() {
    const unusedPoints = lineage(rootSpecies)
      .map((x) => x.freeMutationPoints)
      .reduce((a, b) => a + b);
    const unusedPointsEl = unusedPoints > 0 ? <div className="unused-points">{unusedPoints}</div> : null;
    return (
      <div className={classNames("panel-left", { open: leftPanelOpen })}>
        {leftPanelOpen ? <PhylogeneticTree onMutate={handleStartMutate} /> : null}
        <button className="panel-left-handle" onClick={() => setLeftPanelOpen((open) => !open)}>
          <GiFamilyTree className="icon" />
          {unusedPointsEl}
        </button>
      </div>
    );
  }

  const handleSpeciesViewerClose = useCallback(() => {
    setViewedSpecies(undefined);
  }, []);
  const speciesViewerEl = (
    <Overlay isOpen={viewedSpecies != null} onClose={handleSpeciesViewerClose}>
      <div className="species-viewer-modal">
        <button className="close" onClick={handleSpeciesViewerClose}>
          ✖
        </button>
        <SpeciesViewer speciesId={viewedSpecies!} editable />
      </div>
    </Overlay>
  );

  const [focusedHex, setFocusedHex] = useState<HexTile | undefined>(undefined);
  const handleFocusHex = useCallback((hex: HexTile) => {
    setFocusedHex(hex);
  }, []);

  const [appState] = useAppReducer();

  const oxygenLevel = useMemo(() => overWorld.computeOxygenLevel(), [overWorld]);
  function renderOxygenLevel() {
    return (
      <div className="oxygen-level">
        <ProgressBar
          className="progress-bar"
          animate={false}
          intent={Intent.SUCCESS}
          stripes={false}
          value={map(oxygenLevel, 0, 1, 0.01, 1)}
        />
        <div className="indicator">{nf(oxygenLevel, 3)}% Global Atmospheric Oxygen</div>
      </div>
    );
  }

  return (
    <div className="overworld-screen">
      <OverWorldMap focusedHex={focusedHex} />
      {maybeRenderPhylogeneticTreePanel()}
      {speciesViewerEl}
      <EpochUI onNextEpoch={onNextEpoch} onFocusHex={handleFocusHex} />
      {renderOxygenLevel()}
      <div style={{ position: "absolute", right: "10px", top: "10px" }}>
        <Button onClick={() => save(appState)}>Save</Button>
      </div>
      <div style={{ position: "absolute", right: "10px", top: "60px" }}>
        <Button onClick={() => resetGame()}>Reset Game</Button>
      </div>
    </div>
  );
});

export default OverWorldScreen;
