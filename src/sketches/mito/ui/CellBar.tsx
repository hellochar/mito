import classNames from "classnames";
import * as React from "react";
import { Vector2 } from "three";
import { Constructor } from "../constructor";
import { Cell, Transport } from "../game/tile";
import { materialInfoMapping } from "../renderers/tile/InstancedTileRenderer";
import { spritesheetLoaded, textureFromSpritesheet } from "../spritesheet";
import "./CellBar.scss";

export interface CellBarProps {
  bar: Constructor<Cell>[];
  index: number;
  onIndexClicked: (index: number) => void;
  buildError?: "water" | "sugar" | "water and sugar";
}

function CellBar({ bar, index, onIndexClicked, buildError }: CellBarProps) {
  const disabled = buildError != null;
  return (
    <div className={classNames("cell-bar", { disabled })}>
      {bar.map((cellType, i) => (
        <CellBarItem
          key={i}
          hotkey={String(i + 1)}
          type={cellType}
          isSelected={index === i}
          onClick={() => onIndexClicked(i)}
          spritesheetLoaded={spritesheetLoaded}
        >
          {cellType === Transport ? <TransportDirArrow dir={Transport.buildDirection} /> : null}
        </CellBarItem>
      ))}
      {disabled ? <div className="disabled-cover">Need {buildError} to build!</div> : null}
    </div>
  );
}

const TransportDirArrow: React.FC<{ dir: Vector2 }> = ({ dir }) => {
  return <div className="transport-dir-arrow" style={{ transform: `rotate(${dir.angle()}rad)` }}></div>;
};

export interface CellBarItemProps {
  children?: React.ReactNode;
  type: Constructor<Cell>;
  isSelected: boolean;
  onClick: () => void;
  spritesheetLoaded: boolean;
  hotkey: string;
}

function CellBarItem({ type, hotkey, isSelected, onClick, spritesheetLoaded, children }: CellBarItemProps) {
  const material = materialInfoMapping.get(type)!;
  const texture = textureFromSpritesheet(material.texturePosition.x, material.texturePosition.y);
  const style: React.CSSProperties = React.useMemo(() => {
    const image = texture.image;
    const color = material.color.getStyle();
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
  }, [material.color, spritesheetLoaded, texture]);
  return (
    <div className={classNames("cell-bar-item", { selected: isSelected })}>
      <div className="cell-bar-item-icon" onClick={onClick} style={style}>
        {type.displayName}
        {children}
      </div>
      <HotkeyButton hotkey={hotkey} onClick={onClick} />
    </div>
  );
}

function ensureCanvasFocus(e: React.SyntheticEvent<any>) {
  e.preventDefault();
  const canvas = document.getElementsByTagName("canvas")[0];
  canvas.focus();
}

interface HotkeyButtonProps extends React.HTMLProps<HTMLDivElement> {
  hotkey: string;
}

function HotkeyButton({ hotkey, onClick, ...restProps }: HotkeyButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick && onClick(e);
    ensureCanvasFocus(e);
  };
  return (
    <div className="mito-hud-button mito-hud-build-item" onClick={handleClick} {...restProps}>
      <span className="mito-hud-button-hotkey">{hotkey}</span>
    </div>
  );
}

export default CellBar;
