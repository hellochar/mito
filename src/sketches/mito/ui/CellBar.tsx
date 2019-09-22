import * as React from "react";
import styled from "styled-components";

import { Constructor } from "../constructor";
import { Cell } from "../game/tile";
import { materialMapping } from "../renderers/TileRenderer";

export interface CellBarProps {
  bar: Constructor<Cell>[];
  index: number;
}

export interface CellTypeProps {
  children?: React.ReactNode;
  type: Constructor<Cell>;
  isSelected: boolean;
}

const CellTypeDiv = styled.div<CellTypeProps>`
  transform: ${props => props.isSelected ? "scale(1.2)" : "scale(1)"};
  transition: transform 0.1s;
  width: 60px;
  height: 60px;
  border: 1px solid darkgrey;
  border-radius: 2px;
  margin: 0 5px;
  background-image:
    ${props => {
      const material = materialMapping().get(props.type)!;
      const color = material.color.getStyle();
      return `linear-gradient(${color}, ${color})`;
    }},
    ${props => {
      const material = materialMapping().get(props.type)!;
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
    }};
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  background-blend-mode: multiply;
  image-rendering: pixelated;
`;

function CellType({ type, isSelected }: CellTypeProps) {
  return (
    <CellTypeDiv type={type} isSelected={isSelected}>{type.displayName}</CellTypeDiv>
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

const CellBarContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 10px;
  margin: 10px;
  border-radius: 5px;
  border: 1px solid grey;
  position: absolute;
  /* bottom: 40px;
  left: 50%; */
  /* transform: translateX(-50%); */
  bottom: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.25);
`;

function CellBar({ bar, index }: CellBarProps) {
  return (
    <CellBarContainer className="cell-bar">
      { bar.map((cellType, i) => (
        <div key={i}>
          <CellType type={cellType} isSelected={index === i} />
          <HotkeyButton hotkey={String(i + 1)} />
        </div>
      )) }
    </CellBarContainer>
  )
}

export default CellBar;

