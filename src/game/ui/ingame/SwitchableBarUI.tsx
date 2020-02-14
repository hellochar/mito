import classNames from "classnames";
import * as React from "react";
import { HotkeyButton } from "../../../sketches/mito/ui/HotkeyButton";
import { CellBar, SwitchableBar } from "../../input/actionBar";
import CellBarUI from "./CellBarUI";
import "./SwitchableBarUI.scss";
import { TileDetails } from "./TileDetails";

export interface SwitchableBarUIProps {
  bar: SwitchableBar;
}

export const SwitchableBarUI: React.FC<SwitchableBarUIProps> = ({ bar }) => {
  const { current } = bar;
  const highlightedTile = bar.interactBar.mito.highlightedTile;
  const barElement =
    current instanceof CellBar ? (
      <CellBarUI bar={current} disabled={current.mito.world.player.getBuildError()} />
    ) : highlightedTile != null ? (
      <TileDetails key={highlightedTile.toString()} tile={highlightedTile} />
    ) : null;
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
