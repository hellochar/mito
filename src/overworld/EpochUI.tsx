import { useAppReducer } from "app";
import classNames from "classnames";
import DynamicNumber from "common/DynamicNumber";
import React, { useState } from "react";
import { GiSandsOfTime } from "react-icons/gi";
import "./EpochUI.scss";
import { HexTile } from "./hexTile";

export function EpochUI({ onNextEpoch, onFocusHex }: EpochUIProps) {
  const [{ epoch, overWorld }] = useAppReducer();
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
      {unusedHexes.length > 0 ? (
        <div onClick={() => onFocusHex(unusedHexes[0])}>{unusedHexes.length} hexes unused</div>
      ) : null}
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
const EPOCH_FORMATTER = new Intl.NumberFormat(undefined, { useGrouping: true, maximumFractionDigits: 0 });
