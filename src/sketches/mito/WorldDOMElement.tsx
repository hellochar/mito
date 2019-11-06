import React from "react";
import { Vector2 } from "three";
import { Mito } from "./index";
export class WorldDOMElement {
  constructor(public mito: Mito, public positionFn: () => Vector2, public renderFn: () => JSX.Element) {}
  render() {
    const worldPosition = this.positionFn();
    const pixelPosition = this.mito.worldToScreen(worldPosition);
    const left = pixelPosition.x;
    const top = pixelPosition.y;
    const style: React.CSSProperties = {
      left,
      top,
    };
    return <div style={style}>{this.renderFn()}</div>;
  }
}
