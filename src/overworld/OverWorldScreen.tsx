import { useAppReducer } from "app";
import { resetGame, save } from "app/saveLoad";
import classNames from "classnames";
import { Button } from "common/Button";
import MutationScreen from "evolution/MutationScreen";
import PhylogeneticTree from "evolution/PhylogeneticTree";
import { Species } from "evolution/species";
import React, { useCallback, useEffect, useState } from "react";
import { GiFamilyTree } from "react-icons/gi";
import Modal from "react-modal";
import { EpochUI } from "./EpochUI";
import { HexTile } from "./hexTile";
import { OverWorldMap } from "./map/OverWorldMap";
import "./OverWorldScreen.scss";

export interface OverWorldScreenProps {
  onNextEpoch: () => void;
}

const OverWorldScreen = ({ onNextEpoch }: OverWorldScreenProps) => {
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [activelyMutatingSpecies, setActivelyMutatingSpecies] = useState<Species | undefined>(undefined);

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
    setActivelyMutatingSpecies(s);
  }, []);

  const handleCommit = useCallback(
    (newSpecies: Species, newPool: number) => {
      if (activelyMutatingSpecies == null) {
        throw new Error("created new species with no actively mutating one!");
      }
      activelyMutatingSpecies.descendants.push(newSpecies);
      // eslint-disable-next-line react/no-direct-mutation-state
      activelyMutatingSpecies.freeMutationPoints = newPool;
      newSpecies.parent = activelyMutatingSpecies;
      setActivelyMutatingSpecies(undefined);
    },
    [activelyMutatingSpecies]
  );

  function maybeRenderMutationModal() {
    const maybeMutationScreen =
      activelyMutatingSpecies != null ? (
        <MutationScreen species={activelyMutatingSpecies} onCommit={handleCommit} />
      ) : null;
    return (
      <Modal
        ariaHideApp={false}
        isOpen={activelyMutatingSpecies != null}
        onRequestClose={() => setActivelyMutatingSpecies(undefined)}
        className="mutation-screen-portal"
      >
        {maybeMutationScreen}
      </Modal>
    );
  }

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
      {maybeRenderMutationModal()}
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
