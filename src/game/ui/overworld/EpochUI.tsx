import classNames from "classnames";
import { useAppReducer } from "game/app";
import DynamicNumber from "game/ui/common/DynamicNumber";
import React, { useState } from "react";
import { GiSandsOfTime } from "react-icons/gi";
import { HexTile } from "../../../core/overworld/hexTile";
import "./EpochUI.scss";

export function EpochUI({ onNextEpoch, onFocusHex }: EpochUIProps) {
  const [{ epoch }] = useAppReducer();
  const [transitioning, setTransitioning] = useState(false);
  const handleNextEpoch = () => {
    setTransitioning(true);
    setTimeout(() => setTransitioning(false), 5000);
    onNextEpoch();
  };
  return (
    <div className={classNames("epoch-display", { "ready-to-advance": false, transitioning })}>
      <span className="number">
        <DynamicNumber sigFigs={6} value={epoch * 1e6} speed={0.08} /> Years
      </span>
      <button className="button-next-epoch" onClick={handleNextEpoch} disabled={transitioning}>
        <GiSandsOfTime className="icon" />
      </button>
    </div>
  );
}
export interface EpochUIProps {
  onNextEpoch: () => void;
  onFocusHex: (hex: HexTile) => void;
}
