import classNames from "classnames";
import * as React from "react";
import { Vector2 } from "three";
import { CellBar } from "../actionBar";
import { Constructor } from "../constructor";
import { Cell, Transport } from "../game/tile";
import { materialInfoMapping } from "../renderers/tile/InstancedTileRenderer";
import { spritesheetLoaded, textureFromSpritesheet } from "../spritesheet";
import "./CellBarUI.scss";
import { HotkeyButton } from "./HotkeyButton";

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
    const material = materialInfoMapping.get(type)!;
    const color = (material.color && material.color.getStyle()) || "transparent";
    const texture = textureFromSpritesheet(material.texturePosition.x, material.texturePosition.y, color);
    const style: React.CSSProperties = React.useMemo(() => {
      const image = texture.image;
      const url = (() => {
        if (image != null) {
          if (image instanceof HTMLCanvasElement && spritesheetLoaded) {
            return image.toDataURL();
          } else if (image instanceof Image) {
            return image.src;
          } else {
            throw new Error("image is" + image);
          }
        } else {
          return "";
        }
      })();
      const backgroundImage = `url(${url}), linear-gradient(${color}, ${color})`;
      return {
        backgroundImage,
      };
    }, [color, spritesheetLoaded, texture.image]);
    return (
      <div className={classNames("cell-bar-item", { selected: isSelected })}>
        <div className="cell-bar-item-icon" onClick={onClick} style={style}>
          {type.displayName}
          {children}
        </div>
        <HotkeyButton className="mito-hud-build-item" hotkey={hotkey} onClick={onClick} />
      </div>
    );
  }
);

export default CellBarUI;
