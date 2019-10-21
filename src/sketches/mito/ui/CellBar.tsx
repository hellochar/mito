import * as React from "react";

import { Constructor } from "../constructor";
import { Cell } from "../game/tile";
import { materialMapping } from "../renderers/TileRenderer";

import "./CellBar.scss";
import classNames from "classnames";
import { spritesheetLoaded } from "../spritesheet";

export interface CellBarProps {
  bar: Constructor<Cell>[];
  index: number;
  onIndexClicked: (index: number) => void;
}

function CellBar({ bar, index, onIndexClicked }: CellBarProps) {
  return (
    <div className="cell-bar">
      {bar.map((cellType, i) => (
        <CellBarItem
          key={i}
          hotkey={String(i + 1)}
          type={cellType}
          isSelected={index === i}
          onClick={() => onIndexClicked(i)}
          spritesheetLoaded={spritesheetLoaded}
        />
      ))}
    </div>
  );
}

export interface CellBarItemProps {
  children?: React.ReactNode;
  type: Constructor<Cell>;
  isSelected: boolean;
  onClick: () => void;
  spritesheetLoaded: boolean;
  hotkey: string;
}

function CellBarItem({ type, hotkey, isSelected, onClick, spritesheetLoaded }: CellBarItemProps) {
  const style: React.CSSProperties = React.useMemo(() => {
    const material = materialMapping().get(type)!;
    const image = material.map!.image;
    const color = material.color.getStyle();
    const url = (() => {
      if (image != null) {
        if (image instanceof HTMLCanvasElement && spritesheetLoaded) {
          return image.toDataURL();
        } else if (image instanceof Image) {
          return image.src;
        } else {
          return "";
        }
      } else {
        return "";
      }
    })();
    const backgroundImage = `url(${url}), linear-gradient(${color}, ${color})`;
    return {
      backgroundImage,
    };
  }, [spritesheetLoaded, type]);
  return (
    <div className={classNames("cell-bar-item", { selected: isSelected })}>
      <div className="cell-bar-item-icon" onClick={onClick} style={style}>
        {type.displayName}
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
