import { AppActions, AppReducerContext, PopulationAttempt } from "app";
import Ticker from "global/ticker";
import { lerp } from "math";
import React from "react";
import { Vector2 } from "three";
import { getCameraPositionCenteredOn, getClickedHexCoords, pixelPosition } from "../hexMath";
import { HexTile } from "../hexTile";
import HexInfo from "./HexInfo";
import HexTileSprite, { DrawingContext } from "./hexTileSprite";
import "./OverWorldMap.scss";
import OverWorldPopover from "./OverWorldPopover";

interface OverWorldMapProps {
  // TODO turn this into a trigger, or global state
  focusedHex?: HexTile;
}

export interface CameraState {
  /**
   * Multiply cartesian hex coord values by scale to get pixel coordinates.
   * Each hex is drawn with radius `scale`.
   */

  scale: number;
  /**
   * dX and dY are pure pixel offsets.
   */
  dX: number;
  dY: number;
}

// function zoomCenteredOn(state: CameraState);

interface OverWorldMapState {
  cameraState: CameraState;
  pressedKeys: { [code: string]: boolean };
  populationAttempt?: PopulationAttempt;
  // TODO one of population attempt or highlighted hex can be
  // non-null at a time
  highlightedHex?: HexTile;
  hoveredHex?: HexTile;
  frame: number;
}

export class OverWorldMap extends React.PureComponent<OverWorldMapProps, OverWorldMapState> implements DrawingContext {
  static contextType = AppReducerContext;

  context!: React.ContextType<typeof AppReducerContext>;

  private hexTileSprites: Map<HexTile, HexTileSprite> = new Map();

  private canvas: HTMLCanvasElement | null = null;

  private rafId?: number;

  get populationAttempt() {
    return this.state.populationAttempt;
  }

  get highlightedHex() {
    return this.state.highlightedHex;
  }

  constructor(props: OverWorldMapProps, context: any) {
    super(props, context);
    const scale = 96;
    const [{ overWorld }] = context;
    const [dX, dY] = getCameraPositionCenteredOn(overWorld.getStartHex(), scale);
    this.state = {
      cameraState: { scale, dX, dY },
      pressedKeys: {},
      frame: 0,
    };
    for (const tile of overWorld) {
      const sprite = new HexTileSprite(tile, this);
      this.hexTileSprites.set(tile, sprite);
    }
  }

  private handleCanvasRef = (ref: HTMLCanvasElement | null) => {
    this.canvas = ref;
    if (ref != null) {
      Ticker.addAnimation(() => {
        if (this.canvas != null) {
          this.setState({ frame: this.state.frame + 1 });
        }
        return this.canvas == null;
      });
      this.handleResize();
    }
  };

  private handleCanvasClick = (e: React.MouseEvent) => {
    if (this.state.populationAttempt != null || this.state.highlightedHex != null) {
      this.setState({
        populationAttempt: undefined,
        highlightedHex: undefined,
      });
    } else {
      const coords = getClickedHexCoords(this.canvas!, this.state.cameraState, e);
      const [{ overWorld }] = this.context;
      const clicked = overWorld.hexAt(coords.i, coords.j);
      // simplest check - we clicked on a tile we can see
      if (clicked != null && clicked.info.visible) {
        // if clicked has no flora, migrate into it
        if (clicked.info.flora == null) {
          const target = clicked;
          const source = overWorld.possibleMigrationSources(clicked)[0];
          if (source != null) {
            const populationAttempt: PopulationAttempt = {
              targetHex: target,
              sourceHex: source,
              settlingSpecies: source.info.flora!.species,
            };
            this.setState({ populationAttempt, highlightedHex: undefined });
          } else {
            // TODO add a Popover for when you see a tile but can't reach it with anything
            // this can happen in the future if earthquakes happen and destroy
            // blocks you used to own
          }
        } else {
          // clicked does have flora; just show a highlight
          const highlightedHex = clicked;
          this.setState({ highlightedHex, populationAttempt: undefined });
        }
      }
    }
  };

  private handleCanvasMouseLeave = () => {
    this.setState({
      hoveredHex: undefined,
    });
  };

  private handleCanvasMouseMove = (e: React.MouseEvent) => {
    const coords = getClickedHexCoords(this.canvas!, this.state.cameraState, e);
    const hex = this.context[0].overWorld.hexAt(coords.i, coords.j);
    this.setState({ hoveredHex: hex });
  };

  private handleClickPlay = () => {
    const [, dispatch] = this.context;
    const appAction = this.getAppAction();
    if (appAction) {
      dispatch({
        type: "AATransitionStart",
        transition: appAction,
      });
    }
  };

  private getAppAction(): AppActions | undefined {
    if (this.state.populationAttempt != null) {
      return {
        type: "AAStartPopulationAttempt",
        populationAttempt: this.state.populationAttempt,
      };
    } else if (this.state.highlightedHex != null) {
      // re-populate the same tile
      const sourceHex = this.state.highlightedHex;
      return {
        type: "AAStartPopulationAttempt",
        populationAttempt: {
          sourceHex,
          targetHex: sourceHex,
          settlingSpecies: sourceHex.info.flora!.species,
        },
      };
    }
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
    });
  };

  private handleWheel = (e: WheelEvent) => {
    const delta = -(e.deltaX + e.deltaY) / 125 / 10;
    const scalar = Math.pow(2, delta);

    const scale = this.state.cameraState.scale * scalar;
    this.setState({
      cameraState: {
        ...this.state.cameraState,
        scale,
      },
    });
  };

  private handleResize = () => {
    if (this.canvas != null) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.updateCanvas();
    }
  };

  private updateCamera = () => {
    const [state] = this.context;
    const { transition } = state;
    if (transition != null) {
      if (transition.type === "AAStartPopulationAttempt") {
        // zoom in
        const { targetHex } = transition.populationAttempt;
        const { scale, dX, dY } = this.state.cameraState;
        const nextScale = scale * 1.02;
        const [targetDX, targetDY] = getCameraPositionCenteredOn(targetHex, scale);
        this.setState({
          cameraState: {
            dX: lerp(dX, targetDX, 0.2),
            dY: lerp(dY, targetDY, 0.2),
            scale: nextScale,
          },
        });
      }
    }
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

  private updateCanvas() {
    if (this.canvas != null) {
      const c = this.canvas.getContext("2d")!;
      this.drawMap(c);
      this.drawMigrationArrows(c);
      this.drawPopulationAttempt(c);
    }
  }

  private drawMap(c: CanvasRenderingContext2D) {
    const { hoveredHex, cameraState } = this.state;
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);

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
  }

  private drawMigrationArrows(c: CanvasRenderingContext2D) {
    const { hoveredHex, populationAttempt } = this.state;
    if (hoveredHex != null && populationAttempt == null) {
      if (hoveredHex.info.flora == null) {
        this.drawPossibleMigrationIntoArrows(c, hoveredHex);
      } else {
        this.drawPossibleMigrationOutOfArrows(c, hoveredHex);
      }
    }
  }

  private drawPopulationAttempt(c: CanvasRenderingContext2D) {
    const { populationAttempt } = this.state;
    if (populationAttempt != null) {
      this.drawMigrationArrow(c, populationAttempt.sourceHex!, populationAttempt.targetHex);
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
    this.updateCanvas();
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
        },
      });
      return dt > 1000 || (Math.abs(targetX - dX) < 1e-2 && Math.abs(targetY - dY) < 1e-2);
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
        {this.maybeRenderPopover()}
      </div>
    );
  }

  drawPossibleMigrationIntoArrows(c: CanvasRenderingContext2D, target: HexTile) {
    const [{ overWorld }] = this.context;
    for (const source of overWorld.possibleMigrationSources(target)) {
      this.drawMigrationArrow(c, source, target);
    }
  }

  drawPossibleMigrationOutOfArrows(c: CanvasRenderingContext2D, source: HexTile) {
    const [{ overWorld }] = this.context;
    for (const target of overWorld.possibleMigrationTargets(source)) {
      this.drawMigrationArrow(c, source, target);
    }
  }

  public drawMigrationArrow(c: CanvasRenderingContext2D, source: HexTile, target: HexTile) {
    const isShadowed = (() => {
      if (this.highlightedHex != null) {
        return true;
      } else if (this.populationAttempt != null) {
        return source !== this.populationAttempt.sourceHex || target !== this.populationAttempt.targetHex;
      } else {
        return false;
      }
    })();
    if (isShadowed) {
      c.globalAlpha = 0.2;
    } else {
      c.globalAlpha = 1;
    }
    const { scale } = this.state.cameraState;
    c.shadowBlur = (3 * scale) / 48;
    c.shadowOffsetX = (4 * scale) / 48;
    c.shadowOffsetY = (4 * scale) / 48;
    c.shadowColor = "black";
    c.strokeStyle = "white";

    c.lineWidth = (3 * scale) / 48;
    c.lineCap = "round";
    c.lineJoin = "round";
    const targetCenter = new Vector2(...pixelPosition(target, this.state.cameraState));
    const sourceCenter = new Vector2(...pixelPosition(source, this.state.cameraState));
    const arrowStart = sourceCenter.clone().lerp(targetCenter, 0.2);
    const arrowEnd = targetCenter.clone().lerp(sourceCenter, 0.2);
    drawArrow(c, arrowStart.x, arrowStart.y, arrowEnd.x, arrowEnd.y, (10 * scale) / 48);
    c.shadowColor = "transparent";
  }

  maybeRenderPopover() {
    const { cameraState, populationAttempt, highlightedHex } = this.state;
    if (populationAttempt != null) {
      return (
        <OverWorldPopover camera={cameraState} tile={populationAttempt.targetHex}>
          <HexInfo
            playSpecies={populationAttempt.settlingSpecies}
            tile={populationAttempt.targetHex}
            onClickPlay={this.handleClickPlay}
          />
        </OverWorldPopover>
      );
    } else if (highlightedHex != null) {
      return (
        <OverWorldPopover camera={cameraState} tile={highlightedHex}>
          <HexInfo
            playSpecies={highlightedHex.info.flora!.species}
            tile={highlightedHex}
            onClickPlay={this.handleClickPlay}
          />
        </OverWorldPopover>
      );
    }
  }
}

function drawArrow(c: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number, headlen = 10) {
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
