import * as React from "react";
import styled from "styled-components";

import { Constructor } from "../constructor";
import { Cell } from "../game/tile";
import { materialMapping } from "../renderers/TileRenderer";

export interface CellBarProps {
  bar: Constructor<Cell>[];
  index: number;
  onIndexClicked: (index: number) => void;
}

function CellBar({ bar, index, onIndexClicked }: CellBarProps) {
  return (
    <CellBarContainer className="cell-bar">
      { bar.map((cellType, i) => (
        <div key={i}>
          <CellBarItem type={cellType} isSelected={index === i} onClick={() => onIndexClicked(i) } />
          <HotkeyButton hotkey={String(i + 1)} onClick={() => onIndexClicked(i) } />
        </div>
      )) }
    </CellBarContainer>
  )
}

const CellBarContainer = styled.div`
  display: flex;
  flex-direction: row;
`;


export interface CellTypeProps {
  children?: React.ReactNode;
  type: Constructor<Cell>;
  isSelected: boolean;
  onClick: () => void;
}

const CellTypeDiv = styled.div<CellTypeProps>`
  transform: ${props => props.isSelected ? "scale(1.2)" : "scale(1)"};
  transition: transform 0.025s;
  width: 60px;
  height: 60px;
  border: 1px solid darkgrey;
  border-radius: 2px;
  margin: 0 5px;
  cursor: pointer;
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

function CellBarItem({ type, isSelected, onClick }: CellTypeProps) {
  return (
    <CellTypeDiv type={type} isSelected={isSelected} onClick={onClick}>{type.displayName}</CellTypeDiv>
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

