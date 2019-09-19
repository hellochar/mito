import { scaleLinear } from "d3-scale";
import React, { CSSProperties, useState } from "react";
import styled, { keyframes } from "styled-components";

import { HexTile } from "./hexTile";
import { roundCubeCoordinates } from "./hexMath";
import { OverWorld } from "./overWorld";

import "./OverWorldMap.scss";
import { Vector2 } from "three";
import { LevelInfo } from "./levelInfo";

const C = Math.sqrt(3) / 2;

interface OverWorldMapProps {
    overWorld: OverWorld;
    onPlayLevel: (level: HexTile) => void;
}

interface CameraState {
  scale: number;
  dX: number;
  dY: number;
}

interface OverWorldMapState {
  cameraState: CameraState;
  pressedKeys: { [code: string]: boolean };
  highlightedTile?: HexTile;
}

export class OverWorldMap extends React.Component<OverWorldMapProps, OverWorldMapState> {
  state: OverWorldMapState = {
    cameraState: { scale: 48, dX: 0, dY: 0 },
    pressedKeys: {},
  };

  private canvas: HTMLCanvasElement | null = null;
  private rafId?: number;

  private handleCanvasRef = (ref: HTMLCanvasElement | null) => {
    this.canvas = ref;
    if (ref != null) {
      this.handleResize();
    }
  }

  private handleCanvasClick = (e: React.MouseEvent) => {
    if (this.canvas != null) {
      if (this.state.highlightedTile != null) {
        this.setState({ highlightedTile: undefined });
      } else {
        const level = getClickedHexTile(this.props.overWorld, this.canvas, this.state.cameraState, e);
        if (level != null && level.info.visible) {
          this.setState({ highlightedTile: level });
        }
      }
    }
  }

  private onPlayLevel = (level: HexTile) => {
      this.props.onPlayLevel(level);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!e.repeat) {
      const newPressedKeys = { ...this.state.pressedKeys, [e.code]: true };
      this.setState({
        pressedKeys: newPressedKeys,
      });
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const newPressedKeys = { ...this.state.pressedKeys };
    delete newPressedKeys[e.code];
    this.setState({
      pressedKeys: newPressedKeys,
    })
  };

  private handleResize = () => {
    if (this.canvas != null) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.drawMap();
    }
  }

  private updateCamera = () => {
    const panSpeed = 20;
    let offset = new Vector2();
    for (const key in this.state.pressedKeys) {
      if (key === 'KeyW' || key === 'ArrowUp') {
        offset.y += panSpeed;
      } else if (key === 'KeyS' || key === 'ArrowDown') {
        offset.y -= panSpeed;
      } else if (key === 'KeyA' || key === 'ArrowLeft') {
        offset.x += panSpeed;
      } else if (key === 'KeyD' || key === 'ArrowRight') {
        offset.x -= panSpeed;
      }
    }
    offset.setLength(panSpeed);

    if (offset.x !== 0 || offset.y !== 0) {
      const cameraState = this.state.cameraState;

      this.setState({
        cameraState: {
          ...cameraState,
          dX: cameraState.dX + offset.x,
          dY: cameraState.dY + offset.y
        }
      });
    }
    this.rafId = requestAnimationFrame(this.updateCamera);
  }

  private drawMap() {
    if (this.canvas != null) {
      const context = this.canvas.getContext("2d")!;
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const tile of this.props.overWorld) {
        drawTile(this.canvas, this.state.cameraState, tile);
      }
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
    this.rafId = requestAnimationFrame(this.updateCamera);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    cancelAnimationFrame(this.rafId!);
  }

  componentDidUpdate() {
    this.drawMap();
  }

  render() {
    return (
      <div className="overworld-map-container">
        <canvas ref={this.handleCanvasRef} onClick={this.handleCanvasClick} />
        {this.maybeRenderHighlightedTile()}
      </div>
    );
  }

  maybeRenderHighlightedTile() {
    if (this.state.highlightedTile != null) {
      return (
        <OverWorldModal camera={this.state.cameraState} tile={this.state.highlightedTile}>
          <HexTileInfo tile={this.state.highlightedTile} onClickPlay={this.onPlayLevel} />
        </OverWorldModal>
      );
    }
  }
}

interface OverWorldModalProps {
  camera: CameraState;
  tile: HexTile;
  children: React.ReactNode;
}

const opacifyIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-80px) scale(0.75);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
`;

const OverworldModalPositioner = styled.div`
  position: absolute;
  left: 20px;
  align-self: center;
  justify-self: top;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 5px;
  color: black;
  animation: ${opacifyIn} 0.2s both;

  &::before {
    position: absolute;
    top: 50%;
    transform: translate(-100%, -50%);
    left: 0;
    content: "";
    border: 20px solid transparent;
    border-right-color: rgba(255, 255, 255, 0.9);
  }
`;

function OverWorldModal({ tile, camera, children }: OverWorldModalProps) {
  const [px, py] = pixelPosition(tile, camera);
  // this element is put in the center
  const container: CSSProperties = {
    zIndex: 1,
    position: "absolute",
    left: px + camera.scale * 0.5,
    top: py,
    display: "flex",
  };
  return (
    <div style={container}>
      <OverworldModalPositioner>
        {children}
      </OverworldModalPositioner>
    </div>
  );
}

function pixelPosition(tile: HexTile, camera: CameraState) {
  const { dX, dY, scale } = camera;
  const { x, y } = tile.cartesian;

  const cX = window.innerWidth / 2 + dX;
  const cY = window.innerHeight / 2 + dY;
  return [cX + x * scale, cY + y * scale];
}

function getClickedHexTile(overWorld: OverWorld, canvas: HTMLCanvasElement, camera: CameraState, event: React.MouseEvent) {
    const { scale, dX, dY } = camera;
    const cX = canvas.width / 2 + dX;
    const cY = canvas.height / 2 + dY;

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
  c.strokeStyle = "rgb(112, 112, 112)";
  c.beginPath();
  c.moveTo(x + r, y);
  for (let i = 1; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    c.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  c.closePath();
  c.fill();
  c.stroke();
}

const colorScale = scaleLinear<string, string>()
  .domain([-1, 0, 1, 5, 6])
  .range(["rgb(0, 60, 255)", "lightblue", "yellow", "orange"]);

function drawTile(canvas: HTMLCanvasElement, camera: CameraState, tile: HexTile) {
  const { scale } = camera;
  const [px, py] = pixelPosition(tile, camera);

  const c = canvas.getContext('2d')!;
  if (tile.info.visible) {
    c.fillStyle = colorScale(tile.info.height);
    drawHex(c, px, py, scale);
    c.font = "12px serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#666";
    c.fillText(tile.info.height + "", px, py, scale);
  } else {
    c.fillStyle = "grey";
    drawHex(c, px, py, scale);
  }
}

interface LevelInfoProps {
  tile: HexTile;
  onClickPlay: (level: HexTile) => void;
}

const HexTileInfoContainer = styled.div`
  margin: 10px;
  width: 320px;
`;

const PlayButton = styled.button`
  cursor: pointer;
  padding: 10px;
  width: 100%;
  background-color: darkgreen;
  color: white;
  font-size: 18px;
`;

const ExpandDetails = styled.div`
  text-transform: uppercase;
  font-size: 12px;
  font-family: sans-serif;
`;

function HexTileInfo({ tile, onClickPlay }: LevelInfoProps) {
  const handleClickPlay = () => {
    onClickPlay(tile);
  }

  const playButtonElement = (tile.info.height === -1 || tile.info.conquered) ? null :
    <PlayButton onClick={handleClickPlay}>Populate</PlayButton>;

  const header =
    tile.info.conquered ? <h1>Populated</h1> :
    (tile.info.height === -1) ? <h1>Deep Water</h1> :
    <h1>Unexplored</h1>;

  const stringifyInfo = { ...tile.info };
  delete stringifyInfo.world;

  const expand = (tile.info.height === -1) ? null : 
    <Expand shrunkElements={
      <ExpandDetails>Details</ExpandDetails>
    }>
      <pre style={{fontSize: "12px"}}>{JSON.stringify(stringifyInfo, null, 4)}</pre>
    </Expand>;

  return (
    <HexTileInfoContainer>
      {header}
      {expand}
      {playButtonElement}
    </HexTileInfoContainer>
  );
}

interface ExpandProps {
  children: React.ReactNode;
  shrunkElements: React.ReactNode;
}

const ExpandButton = styled.div`
  cursor: pointer;
  position: relative;
  border-bottom: 1px solid black;
  margin: 20px 0;
  display: flex;
`;

const ExpandCaret = styled.div`
  margin-left: auto;
`;

function Expand({ children, shrunkElements }: ExpandProps) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div>
      <ExpandButton onClick={handleExpandClick}>
        { shrunkElements }
        { expanded ? <ExpandCaret>▼</ExpandCaret> : <ExpandCaret>▶</ExpandCaret>}
      </ExpandButton>
      { expanded ? <div>{children}</div> : null }
    </div>
  )
}
