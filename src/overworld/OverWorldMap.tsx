import { scaleLinear } from "d3-scale";
import React, { useRef, useEffect } from "react";

import { HexTile } from "./hexTile";
import { roundCubeCoordinates } from "./hexMath";
import { OverWorld } from "./overWorld";

import "./OverWorldMap.scss";

const C = Math.sqrt(3) / 2;

interface OverWorldMapProps {
    overWorld: OverWorld;
    onClickLevel: (level: HexTile) => void;
}

export const OverWorldMap: React.FunctionComponent<OverWorldMapProps> = ({ overWorld, onClickLevel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        canvasRef.current!.width = window.innerWidth;
        canvasRef.current!.height = window.innerHeight;
    }, [canvasRef]);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas != null) {
            for (const tile of overWorld) {
                drawTile(canvas, tile);
            }
        }
    });

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (canvasRef.current != null) {
            const level = getClickedHexTile(overWorld, canvasRef.current, e);
            onClickLevel(level);
        }
    }

    return (
        <div className="overworld-map-container">
            <canvas ref={canvasRef} onClick={handleCanvasClick} />
        </div>
    );
};

function getClickedHexTile(overWorld: OverWorld, canvas: HTMLCanvasElement, event: React.MouseEvent) {
    const scale = canvas.width / 100;
    const cX = canvas.width / 2;
    const cY = canvas.height / 2;

    const e = event.nativeEvent;
    const pxX = e.offsetX;
    const pxY = e.offsetY;
    const x = (pxX - cX) / scale;
    const y = (pxY - cY) / scale;
    // we now have a fractional cartesian coordinates
    // now we flip the equations:

    // x = 1.5i
    // i = x / 1.5

    // y = 2Cj + Ci
    // j = (y - Ci) / (2 * C)

    const i = x / 1.5;
    const j = (y - C * i) / (2 * C);
    const k = -(i + j);

    const rounded = roundCubeCoordinates(i, j, k);

    return overWorld.tileAt(rounded.i, rounded.j);
}

function drawHex(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  // c.strokeStyle = "gray";
  c.beginPath();
  c.moveTo(x + r, y);
  for (let i = 1; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    c.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  c.closePath();
  c.fill();
  // c.stroke();
}

const colorScale = scaleLinear<string, string>()
  .domain([-1, 0, 1, 5, 6])
  .range(["rgb(0, 60, 255)", "lightblue", "yellow", "orange"]);

function drawTile(canvas: HTMLCanvasElement, tile: HexTile) {
  const scale = canvas.width / 100;
  const cX = canvas.width / 2;
  const cY = canvas.height / 2;
  const c = canvas.getContext('2d')!;
  if (tile.info.visible) {
    const { x, y } = tile.cartesian;
    c.fillStyle = colorScale(tile.info.height);
    drawHex(c, cX + x * scale, cY + y * scale, scale);
    c.font = "12px serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#666";
    c.fillText(tile.info.height + "", cX + x * scale, cY + y * scale, scale);
  } else {
    const { x, y } = tile.cartesian;
    c.fillStyle = "grey";
    drawHex(c, cX + x * scale, cY + y * scale, scale);
  }
}
