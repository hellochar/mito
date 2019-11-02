import { AppReducerContext } from "app";
import Ticker from "global/ticker";
import React from "react";
import { Vector2 } from "three";
import { Species } from "../../evolution/species";
import { getCameraPositionCenteredOn, getClickedHexCoords, pixelPosition } from "../hexMath";
import { HexTile } from "../hexTile";
import HexTileInfo from "./HexTileInfo";
import HexTileSprite from "./hexTileSprite";
import "./OverWorldMap.scss";
import OverWorldPopover from "./OverWorldPopover";

interface OverWorldMapProps {
  onPlayLevel: (level: HexTile, species: Species) => void;
  // TODO turn this into a trigger, or global state
  focusedHex?: HexTile;
}

export interface CameraState {
  scale: number;
  dX: number;
  dY: number;
}

interface OverWorldMapState {
  cameraState: CameraState;
  pressedKeys: { [code: string]: boolean };
  highlightedHex?: HexTile;
  hoveredHex?: HexTile;
  frame: number;
}

export class OverWorldMap extends React.PureComponent<OverWorldMapProps, OverWorldMapState> {
  static contextType = AppReducerContext;

  context!: React.ContextType<typeof AppReducerContext>;

  private hexTileSprites: Map<HexTile, HexTileSprite> = new Map();

  constructor(props: OverWorldMapProps, context: OverWorldMap["context"]) {
    super(props, props);
    const scale = 96;
    const [{ overWorld }] = context;
    const [dX, dY] = getCameraPositionCenteredOn(overWorld.getStartTile(), scale);
    this.state = {
      cameraState: { scale, dX, dY },
      pressedKeys: {},
      frame: 0,
    };
    for (const tile of overWorld) {
      const sprite = new HexTileSprite(tile);
      this.hexTileSprites.set(tile, sprite);
    }
  }

  private canvas: HTMLCanvasElement | null = null;
  private rafId?: number;

  private handleCanvasRef = (ref: HTMLCanvasElement | null) => {
    this.canvas = ref;
    if (ref != null) {
      Ticker.addAnimation(() => {
        this.setState({ frame: this.state.frame + 1 });
        return this.canvas == null;
      });
      this.handleResize();
    }
  };

  private handleCanvasClick = (e: React.MouseEvent) => {
    if (this.state.highlightedHex != null) {
      this.setState({ highlightedHex: undefined });
    } else {
      const coords = getClickedHexCoords(this.canvas!, this.state.cameraState, e);
      const level = this.context[0].overWorld.hexAt(coords.i, coords.j);
      if (level != null && level.info.visible) {
        this.setState({ highlightedHex: level });
      }
    }
  };

  private handleCanvasMouseLeave = () => {
    this.setState({
      hoveredHex: undefined
    });
  }

  private handleCanvasMouseMove = (e: React.MouseEvent) => {
    const coords = getClickedHexCoords(this.canvas!, this.state.cameraState, e);
    const hex = this.context[0].overWorld.hexAt(coords.i, coords.j);
    this.setState({ hoveredHex: hex });
  };

  private onPlayLevel = (level: HexTile, species: Species) => {
    this.props.onPlayLevel(level, species);
  };

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
    });
  };

  private handleWheel = (e: WheelEvent) => {
    const delta = -(e.deltaX + e.deltaY) / 125 / 10;
    const scalar = Math.pow(2, delta);

    const scale = this.state.cameraState.scale * scalar;
    this.setState({
      cameraState: {
        ...this.state.cameraState,
        scale
      }
    });
  };

  private handleResize = () => {
    if (this.canvas != null) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.drawMap();
    }
  };

  private updateCamera = () => {
    const panSpeed = 20;
    let offset = new Vector2();
    for (const key in this.state.pressedKeys) {
      if (key === "KeyW" || key === "ArrowUp") {
        offset.y += panSpeed;
      } else if (key === "KeyS" || key === "ArrowDown") {
        offset.y -= panSpeed;
      } else if (key === "KeyA" || key === "ArrowLeft") {
        offset.x += panSpeed;
      } else if (key === "KeyD" || key === "ArrowRight") {
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
          dY: cameraState.dY + offset.y,
        },
      });
    }
  };

  private drawMap() {
    if (this.canvas != null) {
      const c = this.canvas.getContext("2d")!;
      const { hoveredHex, cameraState } = this.state;
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (hoveredHex != null) {
        this.hexTileSprites.get(hoveredHex)!.setIsHovered();
      }
      const sprites = Array.from(this.hexTileSprites.values());
      sprites.sort((b, a) => {
        return b.zIndex - a.zIndex;
      });
      for (const sprite of sprites) {
        sprite.draw(c, cameraState);
      }

      if (hoveredHex != null) {
        this.drawMigrationArrows(c, hoveredHex);
      }
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    document.addEventListener("wheel", this.handleWheel);
    window.addEventListener("resize", this.handleResize);
    this.rafId = Ticker.addAnimation(this.updateCamera);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("wheel", this.handleWheel);
    window.removeEventListener("resize", this.handleResize);
    Ticker.removeAnimation(this.rafId!);
  }

  componentDidUpdate(prevProps: OverWorldMapProps) {
    if (prevProps.focusedHex !== this.props.focusedHex && this.props.focusedHex != null) {
      this.focusHex(this.props.focusedHex);
    }
    this.drawMap();
  }

  focusHex(hex: HexTile) {
    let tStart = 0;
    Ticker.addAnimation((t) => {
      if (tStart === 0) {
        tStart = t;
      }
      const dt = t - tStart;
      const [targetX, targetY] = getCameraPositionCenteredOn(hex, this.state.cameraState.scale);
      const dX = this.state.cameraState.dX * 0.5 + targetX * 0.5;
      const dY = this.state.cameraState.dY * 0.5 + targetY * 0.5;
      this.setState({
        cameraState: {
          ...this.state.cameraState,
          dX,
          dY,
        }
      });
      return dt > 1000 ||
        (Math.abs(targetX - dX) < 1e-2 && Math.abs(targetY - dY) < 1e-2);
    });
  }

  render() {
    return (
      <div className="overworld-map-container">
        <canvas
          tabIndex={-1}
          ref={this.handleCanvasRef}
          onClick={this.handleCanvasClick}
          onMouseLeave={this.handleCanvasMouseLeave}
          onMouseMove={this.handleCanvasMouseMove}
        />
        {this.maybeRenderHexPopover()}
      </div>
    );
  }

  drawMigrationArrows(c: CanvasRenderingContext2D, hoveredHex: HexTile) {
    const { scale } = this.state.cameraState;
    const [{ overWorld }] = this.context;
    const possibleSourceHexes = overWorld.hexNeighbors(hoveredHex).filter((hex) => {
      return hex.info.flora != null && hex.info.flora.actionPoints > 0;
    });
    c.shadowBlur = 3 * scale / 48;
    c.shadowOffsetX = 4 * scale / 48;
    c.shadowOffsetY = 4 * scale / 48;
    c.shadowColor = "black";
    c.strokeStyle = "white";
    c.lineWidth = 1 * scale / 48;
    const [tox, toy] = pixelPosition(hoveredHex, this.state.cameraState);
    for (const source of possibleSourceHexes) {
      const [fromx, fromy] = pixelPosition(source, this.state.cameraState);
      canvas_arrow(c, fromx, fromy, tox, toy, 10 * scale / 48);
    }
    c.shadowColor = "transparent";
  }

  maybeRenderHexPopover() {
    if (this.state.highlightedHex != null) {
      return (
        <OverWorldPopover camera={this.state.cameraState} tile={this.state.highlightedHex}>
          <HexTileInfo tile={this.state.highlightedHex} onClickPlay={this.onPlayLevel} />
        </OverWorldPopover>
      );
    }
  }
}

function canvas_arrow(c: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number, headlen = 10) {
  c.beginPath();
  var dx = tox - fromx;
  var dy = toy - fromy;
  var angle = Math.atan2(dy, dx);
  c.moveTo(fromx, fromy);
  c.lineTo(tox, toy);
  c.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  c.moveTo(tox, toy);
  c.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
  c.stroke();
}
