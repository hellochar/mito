import Ticker from "global/ticker";
import React from "react";
import { Vector2 } from "three";
import { Species } from "../../evolution/species";
import { getCameraPositionCenteredOn, getClickedHexCoords } from "../hexMath";
import { HexTile } from "../hexTile";
import { OverWorld } from "../overWorld";
import HexTileInfo from "./HexTileInfo";
import HexTileSprite from "./hexTileSprite";
import "./OverWorldMap.scss";
import OverWorldPopover from "./OverWorldPopover";

interface OverWorldMapProps {
  rootSpecies: Species;
  overWorld: OverWorld;
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
  frame: number;
}

export class OverWorldMap extends React.PureComponent<OverWorldMapProps, OverWorldMapState> {

  private hexTileSprites: Map<HexTile, HexTileSprite> = new Map();

  constructor(props: OverWorldMapProps) {
    super(props);
    const scale = 96;
    const [dX, dY] = getCameraPositionCenteredOn(props.overWorld.getStartTile(), scale);
    this.state = {
      cameraState: { scale, dX, dY },
      pressedKeys: {},
      frame: 0,
    };
    for (const tile of props.overWorld) {
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
    if (this.canvas != null) {
      if (this.state.highlightedHex != null) {
        this.setState({ highlightedHex: undefined });
      } else {
        const coords = getClickedHexCoords(this.canvas, this.state.cameraState, e);
        const level = this.props.overWorld.tileAt(coords.i, coords.j);
        if (level != null && level.info.visible) {
          this.setState({ highlightedHex: level });
        }
      }
    }
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
      const context = this.canvas.getContext("2d")!;
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const sprite of this.hexTileSprites.values()) {
        sprite.draw(context, this.state.cameraState);
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
        <canvas tabIndex={-1} ref={this.handleCanvasRef} onClick={this.handleCanvasClick} />
        {this.maybeRenderHexPopover()}
      </div>
    );
  }

  maybeRenderHexPopover() {
    if (this.state.highlightedHex != null) {
      return (
        <OverWorldPopover camera={this.state.cameraState} tile={this.state.highlightedHex}>
          <HexTileInfo rootSpecies={this.props.rootSpecies} tile={this.state.highlightedHex} onClickPlay={this.onPlayLevel} />
        </OverWorldPopover>
      );
    }
  }
}
