import classNames from "classnames";
import * as React from "react";
import { Vector2 } from "three";
import { CellBar } from "../actionBar";
import { Constructor } from "../constructor";
import { Cell, Transport } from "../game/tile";
import { spritesheetLoaded } from "../spritesheet";
import "./CellBarUI.scss";
import { HotkeyButton } from "./HotkeyButton";
import IconCell from "./IconCell";

export interface CellBarProps {
  bar: CellBar;
  disabled?: true | "water" | "sugar" | "water and sugar";
}

function CellBarUI({ bar, disabled }: CellBarProps) {
  const index = bar.index();
  const disabledEl = disabled == null ? null : disabled === true ? "" : <>Need {disabled} to build!</>;
  const isBuildError = typeof disabled === "string";
  return (
    <div className={classNames("cell-bar", { disabled })}>
      <div className="cell-bar-items">
        {bar.bar.map((cellType, i) => (
          <CellBarItem
            key={i}
            bar={bar}
            index={i}
            hotkey={String(i + 1)}
            type={cellType}
            isSelected={index === i}
            spritesheetLoaded={spritesheetLoaded}
          >
            {cellType === Transport ? <TransportDirArrow dir={Transport.buildDirection} /> : null}
            {/* {cellType === Fruit ? <Glow /> : null} */}
          </CellBarItem>
        ))}
      </div>
      {disabled ? (
        <div className={classNames("disabled-cover", { "build-error": isBuildError })}>{disabledEl}</div>
      ) : null}
    </div>
  );
}

const TransportDirArrow: React.FC<{ dir: Vector2 }> = ({ dir }) => {
  return <div className="transport-dir-arrow" style={{ transform: `rotate(${dir.angle()}rad)` }}></div>;
};

export interface CellBarItemProps {
  bar: CellBar;
  index: number;
  type: Constructor<Cell>;
  isSelected: boolean;
  spritesheetLoaded: boolean;
  hotkey: string;
}

const CellBarItem: React.FC<CellBarItemProps> = React.memo(
  ({ bar, index, type, hotkey, isSelected, spritesheetLoaded, children }) => {
    const onClick = React.useCallback(() => {
      bar.setIndex(index);
    }, [bar, index]);
    return (
      <div className={classNames("cell-bar-item", { selected: isSelected })}>
        <IconCell onClick={onClick} cellType={type} spritesheetLoaded={spritesheetLoaded}>
          {type.displayName}
          {children}
        </IconCell>
        <HotkeyButton className="mito-hud-build-item" hotkey={hotkey} onClick={onClick} />
      </div>
    );
  }
);

export default CellBarUI;
