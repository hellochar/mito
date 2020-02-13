import classNames from "classnames";
import { Species } from "core/species";
import { useAppReducer } from "game/app";
import { resetGame, save } from "game/app/saveLoad";
import { Button } from "game/ui/common/Button";
import PhylogeneticTree from "game/ui/overworld/PhylogeneticTree";
import React, { useCallback, useEffect, useState } from "react";
import { GiFamilyTree } from "react-icons/gi";
import { HexTile } from "../../core/overworld/hexTile";
import { EpochUI } from "../ui/overworld/EpochUI";
import { OverWorldMap } from "../ui/overworld/map/OverWorldMap";
import "./OverWorldScreen.scss";

export interface OverWorldScreenProps {
  onNextEpoch: () => void;
}

const OverWorldScreen = ({ onNextEpoch }: OverWorldScreenProps) => {
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

  const handleStartMutate = useCallback((s: Species) => {
    // TODO fill in
  }, []);

  function maybeRenderPhylogeneticTreePanel() {
    return (
      <div className={classNames("panel-left", { open: leftPanelOpen })}>
        {leftPanelOpen ? <PhylogeneticTree onMutate={handleStartMutate} /> : null}
        <button className="panel-left-handle" onClick={() => setLeftPanelOpen((open) => !open)}>
          <GiFamilyTree className="icon" />
        </button>
      </div>
    );
  }

  const [focusedHex, setFocusedHex] = useState<HexTile | undefined>(undefined);
  const handleFocusHex = useCallback((hex: HexTile) => {
    setFocusedHex(hex);
  }, []);

  const [appState] = useAppReducer();

  return (
    <div className="overworld-screen">
      <OverWorldMap focusedHex={focusedHex} />
      {maybeRenderPhylogeneticTreePanel()}
      <EpochUI onNextEpoch={onNextEpoch} onFocusHex={handleFocusHex} />
      <div style={{ position: "absolute", right: "10px", top: "10px" }}>
        <Button onClick={() => save(appState)}>Save</Button>
      </div>
      <div style={{ position: "absolute", right: "10px", top: "60px" }}>
        <Button onClick={() => resetGame()}>Reset Game</Button>
      </div>
    </div>
  );
};

export default OverWorldScreen;
