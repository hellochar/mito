import classNames from "classnames";
import * as React from "react";
import { CellBar, SwitchableBar } from "../actionBar";
import { Tile } from "../game/tile";
import CellBarUI from "./CellBarUI";
import { HotkeyButton } from "./HotkeyButton";
import "./SwitchableBarUI.scss";
import { TileDetails } from "./TileDetails";

export interface SwitchableBarUIProps {
  bar: SwitchableBar;
}

const InteractBarUI: React.FC<{ tile: Tile | undefined }> = ({ tile }) => {
  return (
    <div className="interact-bar">
      <TileDetails tile={tile} />
    </div>
  );
};

export const SwitchableBarUI: React.FC<SwitchableBarUIProps> = ({ bar }) => {
  const { current } = bar;
  const barElement =
    current instanceof CellBar ? (
      <CellBarUI bar={current} buildError={current.world.player.getBuildError()} />
    ) : (
      <InteractBarUI tile={current.mito.highlightedTile} />
    );
  const hudSwitcherHotkeyElement =
    current instanceof CellBar ? (
      <HotkeyButton className="switcher right" hotkey="Space&nbsp;➡" onClick={() => bar.setToInteract()} />
    ) : (
      <HotkeyButton className="switcher left" hotkey="⬅&nbsp;1...5" onClick={() => bar.setToBuild()} />
    );
  const currentClassName = current instanceof CellBar ? "cell" : "interact";
  return (
    <div className={classNames("switchable-bar", currentClassName)}>
      {barElement}
      {hudSwitcherHotkeyElement}
    </div>
  );
};

export default SwitchableBarUI;
