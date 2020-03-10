import classNames from "classnames";
import React, { useRef } from "react";
import { Vector2 } from "three";
import uuid from "uuid";
import { Tile } from "../../core/tile";
import { Mito } from "./mito";

export class WorldDOMElement {
  uuid = uuid();

  constructor(
    public mito: Mito,
    public positionFn: () => Vector2 | Tile | null,
    public renderFn: () => React.ReactNode
  ) {}

  render() {
    const posOrTile = this.positionFn();
    if (posOrTile == null) {
      return null;
    }
    let style: React.CSSProperties;
    if (posOrTile instanceof Vector2) {
      const pos = posOrTile;
      const pixelPosition = this.mito.worldToScreen(pos);
      const left = pixelPosition.x;
      const top = pixelPosition.y;
      style = {
        left,
        top,
      };
    } else {
      const tile = posOrTile;
      const worldTopLeft = tile.pos.clone().addScalar(-0.5);
      const worldBottomRight = tile.pos.clone().addScalar(0.5);
      const pixelTopLeft = this.mito.worldToScreen(worldTopLeft);
      const pixelBottomRight = this.mito.worldToScreen(worldBottomRight);
      const left = pixelTopLeft.x;
      const top = pixelTopLeft.y;
      const width = pixelBottomRight.x - left;
      const height = pixelBottomRight.y - top;
      style = {
        left,
        top,
        width,
        height,
      };
    }
    return (
      <div key={this.uuid} style={style}>
        {this.renderFn()}
      </div>
    );
  }
}

export const WorldDOMComponent: React.FC<{
  className?: string;
  mito: Mito;
  positionFn: () => Vector2 | Tile | null;
}> = ({ className, children, mito, positionFn }) => {
  const id = useRef(uuid());

  const posOrTile = positionFn();
  if (posOrTile == null) {
    return null;
  }
  let style: React.CSSProperties;
  if (posOrTile instanceof Vector2) {
    const pos = posOrTile;
    const pixelPosition = mito.worldToScreen(pos);
    const left = pixelPosition.x;
    const top = pixelPosition.y;
    style = {
      left,
      top,
    };
  } else {
    const tile = posOrTile;
    const worldTopLeft = tile.pos.clone().addScalar(-0.5);
    const worldBottomRight = tile.pos.clone().addScalar(0.5);
    const pixelTopLeft = mito.worldToScreen(worldTopLeft);
    const pixelBottomRight = mito.worldToScreen(worldBottomRight);
    const left = pixelTopLeft.x;
    const top = pixelTopLeft.y;
    const width = pixelBottomRight.x - left;
    const height = pixelBottomRight.y - top;
    style = {
      left,
      top,
      width,
      height,
    };
  }

  return (
    <div key={id.current} style={style} className={classNames("world-dom-component", className)}>
      {children}
    </div>
  );
};
