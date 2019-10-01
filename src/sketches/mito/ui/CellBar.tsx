import * as React from "react";

import { Constructor } from "../constructor";
import { Cell } from "../game/tile";
import { materialMapping } from "../renderers/TileRenderer";

import "./CellBar.scss";
import classNames from "classnames";
import { RectAreaLight } from "three";

export interface CellBarProps {
  bar: Constructor<Cell>[];
  index: number;
  onIndexClicked: (index: number) => void;
}

function CellBar({ bar, index, onIndexClicked }: CellBarProps) {
  return (
    <div className="cell-bar">
      { bar.map((cellType, i) => (
        <div key={i}>
          <CellBarItem type={cellType} isSelected={index === i} onClick={() => onIndexClicked(i) } />
          <HotkeyButton hotkey={String(i + 1)} onClick={() => onIndexClicked(i) } />
        </div>
      )) }
    </div>
  )
}

export interface CellBarItemProps {
  children?: React.ReactNode;
  type: Constructor<Cell>;
  isSelected: boolean;
  onClick: () => void;
}

function CellBarItem({ type, isSelected, onClick }: CellBarItemProps) {
  const style: React.CSSProperties = React.useMemo(() => {
    const material = materialMapping().get(type)!;
    const color = material.color.getStyle();
    const url = (() => {
      const image = material.map!.image;
      if (image != null) {
        if (image instanceof HTMLCanvasElement) {
          return `url(${image.toDataURL()})`;
        } else if (image instanceof Image) {
          return `url(${image.src})`;
        }
      } else {
        return "url()";
      }
    })();
    const backgroundImage = `linear-gradient(${color}, ${color}), ${url}`;
    return {
      backgroundImage
    };
  }, [type]);
  return (
    <div
      className={classNames("cell-bar-item", { selected: isSelected })}
      onClick={onClick}
      style={style}
    >{type.displayName}</div>
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

