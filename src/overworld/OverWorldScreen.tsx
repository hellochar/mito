import classNames from "classnames";
import DynamicNumber from "common/DynamicNumber";
import MutationScreen from "evolution/MutationScreen";
import PhylogeneticTree from "evolution/PhylogeneticTree";
import { Species } from "evolution/species";
import React, { useCallback, useEffect, useState } from "react";
import { GiFamilyTree, GiSandsOfTime } from "react-icons/gi";
import Modal from "react-modal";
import { HexTile } from "./hexTile";
import { OverWorldMap } from "./map/OverWorldMap";
import { OverWorld } from "./overWorld";
import "./OverWorldScreen.scss";


export interface OverWorldScreenProps {
  rootSpecies: Species;
  epoch: number;
  overWorld: OverWorld;
  onPopulationAttempt: (level: HexTile, species: Species) => void;
  onNextEpoch: () => void;
}

const OverWorldScreen = ({ rootSpecies, epoch, overWorld, onPopulationAttempt: onPlayLevel, onNextEpoch }: OverWorldScreenProps) => {
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
    }
  }, []);

  const handleStartMutate = useCallback((s: Species) => {
    setActivelyMutatingSpecies(s);
  }, []);

  const handleCommit = useCallback((newSpecies: Species, newPool: number) => {
    if (activelyMutatingSpecies == null) {
      throw new Error("created new species with no actively mutating one!");
    }
    activelyMutatingSpecies.descendants.push(newSpecies);
    // eslint-disable-next-line react/no-direct-mutation-state
    activelyMutatingSpecies.freeMutationPoints = newPool;
    newSpecies.parent = activelyMutatingSpecies;
    setActivelyMutatingSpecies(undefined);
  }, [activelyMutatingSpecies]);

  function maybeRenderMutationModal() {
    const maybeMutationScreen = activelyMutatingSpecies != null ? (
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
        {leftPanelOpen ? (
          <PhylogeneticTree onMutate={handleStartMutate} rootSpecies={rootSpecies} />
        ) : null}
        <button
          className="panel-left-handle"
          onClick={() => setLeftPanelOpen((open) => !open)}>
          <GiFamilyTree className="icon" />
        </button>
      </div>
    );
  }

  const [focusedHex, setFocusedHex] = useState<HexTile | undefined>(undefined);
  const handleFocusHex = useCallback((hex: HexTile) => {
    setFocusedHex(hex);
  }, []);

  return (
    <div className="overworld-screen">
      <OverWorldMap focusedHex={focusedHex} overWorld={overWorld} rootSpecies={rootSpecies} onPlayLevel={onPlayLevel} />
      {maybeRenderPhylogeneticTreePanel()}
      {maybeRenderMutationModal()}
      <EpochUI epoch={epoch} onNextEpoch={onNextEpoch} onFocusHex={handleFocusHex} overWorld={overWorld} />
    </div>
  )
};

export interface EpochUIProps {
  epoch: number;
  overWorld: OverWorld;
  onNextEpoch: () => void;
  onFocusHex: (hex: HexTile) => void;
}

const EPOCH_FORMATTER = new Intl.NumberFormat(undefined, { useGrouping: true, maximumFractionDigits: 0 });
function EpochUI({ epoch, overWorld, onNextEpoch, onFocusHex }: EpochUIProps) {
  const [transitioning, setTransitioning] = useState(false);
  const unusedHexes = overWorld.unusedHexes();
  const isReadyToAdvance = unusedHexes.length === 0;
  const handleNextEpoch = () => {
    setTransitioning(true);
    setTimeout(() => setTransitioning(false), 5000);
    onNextEpoch();
  };
  return (
    <div className={classNames("epoch-display", { "ready-to-advance": isReadyToAdvance, transitioning })}>
      <span className="number">
        <DynamicNumber formatter={EPOCH_FORMATTER} value={epoch * 1e6} speed={0.08} /> Years
      </span>
      {unusedHexes.length > 0 ?
        <div onClick={() => onFocusHex(unusedHexes[0])}>{unusedHexes.length} hexes unused</div>
        : null}
      <button className="button-next-epoch" onClick={handleNextEpoch} disabled={transitioning}>
        {/* {isReadyToAdvance ? <GiSandsOfTime className="icon" /> : `${unusedHexes.length} hexes unused`} */}
        <GiSandsOfTime className="icon" />
      </button>
    </div>
  );
}

export default OverWorldScreen;