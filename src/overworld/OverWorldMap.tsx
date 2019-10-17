import { scaleLinear } from "d3-scale";
import React from "react";
import Modal from "react-modal";

import { HexTile } from "./hexTile";
import { roundCubeCoordinates, pixelPosition } from "./hexMath";
import { OverWorld } from "./overWorld";

import "./OverWorldMap.scss";
import { Vector2 } from "three";
import OverWorldPopover from "./OverWorldPopover";
import HexTileInfo from "./HexTileInfo";
import PhylogeneticTree from "../evolution/PhylogeneticTree";
import { Species } from "../evolution/species";
import MutationScreen from "../evolution/MutationScreen";
import { GiFamilyTree } from "react-icons/gi";
import classNames from "classnames";

const C = Math.sqrt(3) / 2;

interface OverWorldMapProps {
  rootSpecies: Species;
  overWorld: OverWorld;
  onPlayLevel: (level: HexTile, species: Species) => void;
  onNextEpoch: () => void;
  epoch: number;
}

export interface CameraState {
  scale: number;
  dX: number;
  dY: number;
}

interface OverWorldMapState {
  cameraState: CameraState;
  pressedKeys: { [code: string]: boolean };
  highlightedTile?: HexTile;
  leftPanelOpen?: boolean;
  activelyMutatingSpecies?: Species;
}

export class OverWorldMap extends React.Component<OverWorldMapProps, OverWorldMapState> {

  constructor(props: OverWorldMapProps) {
    super(props);
    this.state = {
      cameraState: { scale: 48, dX: 0, dY: 0 },
      pressedKeys: {},
      leftPanelOpen: true,
      // activelyMutatingSpecies: props.rootSpecies,
    };
  }

  private canvas: HTMLCanvasElement | null = null;
  private rafId?: number;

  private handleCanvasRef = (ref: HTMLCanvasElement | null) => {
    this.canvas = ref;
    if (ref != null) {
      this.handleResize();
    }
  };

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
  };

  private handleStartMutate = (s: Species) => {
    this.setState({
      activelyMutatingSpecies: s
    });
  };

  private handleCommit = (newSpecies: Species, newPool: number) => {
    if (this.state.activelyMutatingSpecies == null) {
      throw new Error("created new species with no actively mutating one!");
    }
    this.state.activelyMutatingSpecies.descendants.push(newSpecies);
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state.activelyMutatingSpecies.freeMutationPoints = newPool;
    newSpecies.parent = this.state.activelyMutatingSpecies;
    this.setState({
      activelyMutatingSpecies: undefined,
    });
  };

  private onPlayLevel = (level: HexTile, species: Species) => {
    this.props.onPlayLevel(level, species);
  };

  private toggleLeftPanelOpen = () => {
    this.setState({
      leftPanelOpen: !this.state.leftPanelOpen
    });
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!e.repeat) {
      if (e.code === "Tab") {
        this.toggleLeftPanelOpen();
        e.preventDefault();
      }
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
    this.rafId = requestAnimationFrame(this.updateCamera);
  };

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
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("resize", this.handleResize);
    this.rafId = requestAnimationFrame(this.updateCamera);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("resize", this.handleResize);
    cancelAnimationFrame(this.rafId!);
  }

  componentDidUpdate() {
    this.drawMap();
  }

  render() {
    return (
      <div className="overworld-map-container">
        <canvas tabIndex={-1} ref={this.handleCanvasRef} onClick={this.handleCanvasClick} />
        {this.maybeRenderHighlightedTile()}
        {this.maybeRenderPhylogeneticTreePanel()}
        {this.maybeRenderMutationModal()}
        {this.renderEpoch()}
      </div>
    );
  }

  renderEpoch() {
    return (
      <div className="epoch-display">
        Epoch {this.props.epoch}
      </div>
    );
  }

  maybeRenderMutationModal() {
    const maybeMutationScreen = this.state.activelyMutatingSpecies != null ? (
      <MutationScreen species={this.state.activelyMutatingSpecies} onCommit={this.handleCommit} />
    ) : null;
    return (
      <Modal
        ariaHideApp={false}
        isOpen={this.state.activelyMutatingSpecies != null}
        onRequestClose={() => this.setState({ activelyMutatingSpecies: undefined })}
        className="mutation-screen-portal"
      >
        {maybeMutationScreen}
      </Modal>
    );
  }

  maybeRenderPhylogeneticTreePanel() {
    return (
      <div className={classNames("panel-left", { open: this.state.leftPanelOpen })}>
        {this.state.leftPanelOpen ? (
          <PhylogeneticTree onMutate={this.handleStartMutate} rootSpecies={this.props.rootSpecies} />
        ) : null}
        <button className="panel-left-handle" onClick={this.toggleLeftPanelOpen}><GiFamilyTree className="icon" /></button>
      </div>
    );
  }

  maybeRenderHighlightedTile() {
    if (this.state.highlightedTile != null) {
      return (
        <OverWorldPopover camera={this.state.cameraState} tile={this.state.highlightedTile}>
          <HexTileInfo rootSpecies={this.props.rootSpecies} tile={this.state.highlightedTile} onClickPlay={this.onPlayLevel} />
        </OverWorldPopover>
      );
    }
  }
}

function getClickedHexTile(
  overWorld: OverWorld,
  canvas: HTMLCanvasElement,
  camera: CameraState,
  event: React.MouseEvent
) {
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

// const FOREST_IMAGE = (() => {
//   const img = new Image();
//   img.src = "/assets/crusades/forest.png";
//   return img;
// })();
// const WATER_IMAGE = (() => {
//   const img = new Image();
//   img.src = "/assets/crusades/water.png";
//   return img;
// })();
// const PLAINS_IMAGE = (() => {
//   const img = new Image();
//   img.src = "/assets/crusades/plains.png";
//   return img;
// })();
// const MOUNTAIN_IMAGE = (() => {
//   const img = new Image();
//   img.src = "/assets/crusades/mountain.png";
//   return img;
// })();

// const TYPE_TO_IMG_MAP = {
//   "forest": FOREST_IMAGE,
//   "mountain": MOUNTAIN_IMAGE,
//   "plains": PLAINS_IMAGE,
//   "water": WATER_IMAGE,
// };

function drawTile(canvas: HTMLCanvasElement, camera: CameraState, tile: HexTile) {
  const { scale } = camera;
  const [px, py] = pixelPosition(tile, camera);

  const c = canvas.getContext("2d")!;

  // const sourceWidth = 1280;
  // const sourceHeight = 1110;
  // const ratio = sourceHeight / sourceWidth;
  // const img = TYPE_TO_IMG_MAP[tile.crusaderType];
  // c.drawImage(img, px, py, scale * 2, scale * ratio * 2);

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
