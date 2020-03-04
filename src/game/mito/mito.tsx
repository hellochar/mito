import { sleep } from "common/promise";
import { Action } from "core/player/action";
import { easeSinIn } from "d3-ease";
import { PopulationAttempt } from "game/app";
import { ISketch, SketchAudioContext } from "game/screens/sketch/sketch";
import * as React from "react";
import { environmentFromLevelInfo } from "std/environments";
import VignetteCapturer from "std/vignette";
import * as THREE from "three";
import { OrthographicCamera, PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as Nodes from "three/examples/jsm/nodes/Nodes";
import configure from "../../common/configure";
import { World } from "../../core";
import { Cell, Tile } from "../../core/tile";
import { clamp, lerp, lerp2, map } from "../../math/index";
import { drums, hookUpAudio, strings, whoosh } from "../audio";
import { GameResult, maybeGetGameResult } from "../gameResult";
import { CellBar, StackedBar, ToolBar } from "../input/actionBar";
import { ControlScheme, PlayerSeedControlScheme } from "../input/ControlScheme";
import { params } from "../params";
import { InstancedTileRenderer } from "../renderers/tile/InstancedTileRenderer";
import { WorldRenderer } from "../renderers/WorldRenderer";
import { NewPlayerTutorial } from "../tutorial";
import { Hover, HUD } from "../ui/ingame";
import Debug from "../ui/ingame/Debug";
import { Instructions } from "../ui/ingame/Instructions";
import { CameraState } from "./cameraState";
import { logRenderInfo } from "./logRenderInfo";
import "./mito.scss";
import { OvalNode } from "./ovalNode";
import { perfDebugThreeObjects } from "./perfDebugThreeObjects";
import { WorldDOMElement } from "./WorldDOMElement";

export class Mito extends ISketch {
  static id = "mito";

  public readonly world: World;

  // public readonly actionBar: SwitchableBar;
  public readonly actionBar: StackedBar;
  // public readonly actionBar: AltHeldBar;

  public readonly scene = configure(new Scene(), (s) => {
    s.background = new THREE.Color("black");
  });

  public readonly scenePlayerSeed = new Scene();

  private readonly camera = new OrthographicCamera(0, 0, 0, 0, -100, 100);

  public tutorialRef: NewPlayerTutorial | null = null;

  public readonly mouse = new THREE.Vector2();

  public mouseDown = false;

  public mouseButton = -1;

  public instructionsOpen = false;

  public readonly audioListener = new THREE.AudioListener();

  public highlightedTile?: Tile;

  private _inspectedCell?: Cell;

  public get inspectedCell() {
    return this._inspectedCell;
  }

  public set inspectedCell(c: Cell | undefined) {
    console.trace("set to", c);
    this._inspectedCell = c;
  }

  public readonly worldRenderer: WorldRenderer;

  private vignetteCapturer = new VignetteCapturer(this);

  public vignettes: HTMLCanvasElement[] = [];

  private hackCamera?: PerspectiveCamera;

  private orbitControls?: OrbitControls;

  private suggestedCamera?: CameraState;

  private userZoom: number;

  private _controls?: ControlScheme;

  public get controls() {
    return this._controls;
  }

  public set controls(controls: ControlScheme | undefined) {
    if (this._controls != null) {
      this._controls.destroy();
    }
    this._controls = controls;
  }

  public nodeFrame = new Nodes.NodeFrame(0);

  public nodePost: Nodes.NodePostProcessing;

  public ovalOutTime: Nodes.FloatNode;

  constructor(
    renderer: WebGLRenderer,
    context: SketchAudioContext,
    attempt: PopulationAttempt,
    public onWinLoss: (result: GameResult) => void
  ) {
    super(renderer, context);
    this.renderer.autoClear = false;
    this.nodePost = new Nodes.NodePostProcessing(renderer);
    this.ovalOutTime = new Nodes.FloatNode(0);
    const noiseNode = new Nodes.MathNode(
      new Nodes.ScreenNode(),
      new OvalNode(this.ovalOutTime),
      this.ovalOutTime,
      Nodes.MathNode.MIN
    );
    this.nodePost.output = noiseNode as any;
    const { info } = attempt.targetHex;
    this.world = new World(environmentFromLevelInfo(info), info.seed, attempt.settlingSpecies);
    this.world.player.on("action-fail", this.handlePlayerActionFail);

    this.camera.position.z = 10;
    this.camera.lookAt(0, 0, 0);
    this.camera.position.x = this.world.player.pos.x;
    this.camera.position.y = this.world.player.pos.y;
    this.camera.zoom = this.userZoom = 1.5;
    this.camera.add(this.audioListener);

    // this.hackCamera = new PerspectiveCamera(60, this.canvas.height / this.canvas.width);

    if (this.hackCamera != null) {
      // this.hackCamera.position.copy(this.camera.position);
      // this.hackCamera.lookAt(0, 0, 0);
      this.orbitControls = new OrbitControls(this.hackCamera, this.canvas);
      this.scene.add(new THREE.AxesHelper(25));
    }

    this.worldRenderer = new WorldRenderer(this.world, this.scene, this);

    hookUpAudio(this.audioContext);
    this.updateAmbientAudio();
    this.attachWindowEvents();

    this.actionBar = new StackedBar(new CellBar(this), new ToolBar(this));
    // this.actionBar = new SwitchableBar(new CellBar(this), new InteractBar(this));
    // this.actionBar = new AltHeldBar(this);
    // this.controls = new ControlScheme(this);
    this.controls = new PlayerSeedControlScheme(this);
  }

  public events = {
    contextmenu: (event: MouseEvent) => {
      event.preventDefault();
      return false;
    },
    mousemove: (event: MouseEvent) => {
      this.mouse.x = event.clientX!;
      this.mouse.y = event.clientY!;
    },
    mousedown: (event: MouseEvent) => {
      this.mouseButton = event.button;
      this.mouseDown = true;
      if (this.mouseButton === 2) {
        if (this.inspectedCell != null) {
          this.inspectedCell = undefined;
        } else {
          const tile = this.getHighlightedTile();
          if (tile == null) {
            return;
          }
          if (tile instanceof Cell) {
            this.inspectedCell = tile;
          }
        }
      }
    },
    mouseup: () => {
      this.mouseDown = false;
    },
    wheel: (e: WheelEvent) => {
      const delta = -(e.deltaX + e.deltaY) / 125 / 20;
      const currZoom = this.userZoom;
      const scalar = Math.pow(2, delta);
      const newZoom = currZoom * scalar;
      this.userZoom = newZoom;
    },
  };

  private handlePlayerActionFail = (action: Action) => {
    if (action.type === "pickup" && this.world.player.inventory.isMaxed()) {
      this.showInvalidAction({ message: "Inventory full!" });
    } else if (action.type === "drop" && action.target && action.target.inventory.isMaxed()) {
      this.showInvalidAction({ message: `${action.target.displayName} inventory full!` });
    } else if (action.type === "interact" && this.world.player.inventory.isMaxed()) {
      this.showInvalidAction({ message: `Inventory full!` });
    } else if (action.type === "build") {
      this.showInvalidAction({ message: "Can't build there!" });
    }
    // this.showInvalidAction({ message: `Could not ${action.type}!` });
  };

  private handleBeforeUnload = () => {
    return true;
  };

  private attachWindowEvents() {
    window.onbeforeunload = this.handleBeforeUnload;
    (window as any).mito = this;
    (window as any).THREE = THREE;
  }

  destroy() {
    // settings controls to undefined calls destroy on controls
    this.controls = undefined;

    window.onbeforeunload = null;
  }

  public render() {
    if (!params.hud) {
      return null;
    }
    const worldDomElementComponents: React.ReactNode[] = [];
    for (const e of this.worldDomElements) {
      worldDomElementComponents.push(e.render());
    }
    const showPlayerHUD = this.world.playerSeed == null;
    return (
      <>
        {/* <NewPlayerTutorial ref={(ref) => this.tutorialRef = ref } mito={this} />, */}
        <HUD mito={this} />
        {showPlayerHUD ? <Hover mito={this} /> : null}
        <div className="world-dom-components">{worldDomElementComponents}</div>
        {params.showGodUI ? <Debug mito={this} /> : null}
        {this.instructionsOpen ? <Instructions play={() => (this.instructionsOpen = false)} /> : null}
      </>
    );
  }

  public updateAmbientAudio() {
    const yPos = this.world.player.pos.y;
    const drumVolume = map(yPos, this.world.height / 2, this.world.height, 0, 0.5);
    const stringsVolume = map(yPos, this.world.height / 2, 0, 0, 0.5);
    drums.gain.gain.value = Math.max(0, drumVolume);
    strings.gain.gain.value = Math.max(0, stringsVolume);
  }

  maybeToggleInstructions(code: string) {
    if (code === "F1") {
      this.instructionsOpen = !this.instructionsOpen;
      return;
    }
    if (this.instructionsOpen) {
      if (code === "Escape") {
        this.instructionsOpen = false;
      }
      return;
    }
  }

  public worldStep(dt: number) {
    if (this.instructionsOpen) {
      return;
    }

    // this.world.player.dropWater = this.keyMap.has("q");
    // this.world.player.dropSugar = this.keyMap.has("e");
    this.world.step(dt);

    if (this.tutorialRef) {
      this.tutorialRef.setState({ time: this.world.time });
    }

    const gameResult = maybeGetGameResult(this);
    if (gameResult != null) {
      this.onWinLoss(gameResult);
    }

    this.updateAmbientAudio();
  }

  private getCameraNormCoordinates(clientX: number, clientY: number) {
    return new THREE.Vector2((clientX / this.canvas.width) * 2 - 1, (-clientY / this.canvas.height) * 2 + 1);
  }

  public getPlayerInfluenceVector(clientX = this.mouse.x, clientY = this.mouse.y) {
    const cursorCameraNorm = this.getCameraNormCoordinates(clientX, clientY);
    const cursorWorld = new Vector3(cursorCameraNorm.x, cursorCameraNorm.y, 0).unproject(this.camera);

    const offset = new Vector2(cursorWorld.x, cursorWorld.y).sub(this.world.player.posFloat);
    offset.clampLength(0, 0.9);
    return offset;
  }

  public getHighlightPosition() {
    if (this.inspectedCell) {
      return this.inspectedCell.pos;
    }
    const clientX = this.mouse.x,
      clientY = this.mouse.y;
    // if (this.actionBar.current instanceof CellBar) {
    const offset = this.getPlayerInfluenceVector(clientX, clientY);
    const { x, y } = this.world.player.posFloat;

    offset.x += x;
    offset.y += y;
    return offset;
    // } else {
    //   const cursorCameraNorm = this.getCameraNormCoordinates(clientX, clientY);
    //   const cursorWorld = new Vector3(cursorCameraNorm.x, cursorCameraNorm.y, 0).unproject(this.camera);
    //   return cursorWorld;
    // }
  }

  public getHighlightedTile() {
    const p = this.getHighlightPosition();
    p.round();

    const tile = this.world.tileAt(p.x, p.y);
    if (tile != null && tile.lightAmount() > 0) {
      return tile;
    }
  }

  worldToScreen(world: Vector2) {
    const screen = new Vector3(world.x, world.y, 0);
    screen.project(this.camera); // `camera` is a THREE.PerspectiveCamera

    screen.x = Math.round((0.5 + screen.x / 2) * this.canvas.width);
    screen.y = Math.round((0.5 - screen.y / 2) * this.canvas.height);

    return screen;
  }

  private worldDomElements = new Set<WorldDOMElement>();

  addWorldDOMElement(positionFn: () => THREE.Vector2 | Tile, renderFn: () => React.ReactNode): WorldDOMElement {
    const e = new WorldDOMElement(this, positionFn, renderFn);
    this.worldDomElements.add(e);
    return e;
  }

  removeWorldDOMElement(worldDomElement: WorldDOMElement) {
    this.worldDomElements.delete(worldDomElement);
  }

  async addFloatingText(position: Vector2 | Tile, text: React.ReactNode) {
    const element = this.addWorldDOMElement(
      () => position,
      () => <div className="floating-text">{text}</div>
    );
    await sleep(1000);
    this.removeWorldDOMElement(element);
  }

  invalidAction?: { message: string };

  async showInvalidAction(invalidAction: { message: string }) {
    this.invalidAction = invalidAction;
    await sleep(3000);
    if (this.invalidAction === invalidAction) {
      this.invalidAction = undefined;
    }
  }

  public animate(millisDelta: number) {
    this.controls?.animate(millisDelta);

    if (this.inspectedCell?.isDead) {
      this.inspectedCell = undefined;
    }

    // cap out at 1/3rd of a second in one frame (about 10 frames)
    const dt = Math.min(millisDelta / 1000, 1 / 3);
    this.worldStep(dt);
    this.worldRenderer.update();

    this.highlightedTile = this.getHighlightedTile();
    if (this.highlightedTile != null) {
      (this.worldRenderer.getOrCreateRenderer(this.highlightedTile) as InstancedTileRenderer).updateHover();
    }

    if (this.vignetteCapturer.isTimeForNewCapture()) {
      const v = this.vignetteCapturer.capture();
      this.vignettes.push(v);
    }

    this.updateCamera(this.suggestedCamera || this.defaultCameraState());

    this.suggestedCamera = undefined;

    if (this.hackCamera != null) {
      this.renderer.render(this.scene, this.hackCamera);
    } else {
      const ovalOutStart = 3.5;
      // did trigger this frame?
      if (this.world.time - dt < ovalOutStart && this.world.time > ovalOutStart) {
        whoosh.play();
      }
      this.ovalOutTime.value = easeSinIn(clamp((this.world.time - ovalOutStart) / 1.5, 0, 1));
      this.nodeFrame.update(millisDelta / 1000);

      // render everything as per norm
      this.renderer.clear();
      this.nodePost.render(this.scene, this.camera, this.nodeFrame);

      // render the player seed on top, after PostProcessing, so it's always there
      this.renderer.clearDepth();
      this.renderer.render(this.scenePlayerSeed, this.camera);
    }
    if (params.debugPerf && this.frameCount % 100 === 0) {
      perfDebugThreeObjects(this);
      logRenderInfo(this.renderer);
    }
  }

  defaultCameraState(): CameraState {
    if (this.world.playerSeed == null) {
      const mouseNorm = this.getCameraNormCoordinates(this.mouse.x, this.mouse.y);

      const cameraTarget = this.world.player.droopPosFloat().clone();
      cameraTarget.x += mouseNorm.x / 2;
      cameraTarget.y -= mouseNorm.y / 2;

      return {
        center: cameraTarget,
        zoom: this.userZoom,
      };
    } else {
      return {
        center: this.world.playerSeed.pos,
        zoom: this.userZoom,
      };
    }
  }

  updateCamera(targetState: CameraState) {
    const { center, zoom } = targetState;
    lerp2(this.camera.position, center, 0.2);
    if (Math.abs(this.camera.zoom - zoom) > 0.001) {
      this.camera.zoom = lerp(this.camera.zoom, targetState.zoom, 0.1);
      this.camera.updateProjectionMatrix();
    }
  }

  suggestCamera(suggestedCamera: CameraState) {
    this.suggestedCamera = suggestedCamera;
  }

  public resize(w: number, h: number) {
    const aspect = h / w;
    // at zoom 1, we see 12 pixels up and 12 pixels down
    const cameraHeight = 12;
    this.camera.left = -cameraHeight / aspect;
    this.camera.right = cameraHeight / aspect;
    this.camera.top = -cameraHeight;
    this.camera.bottom = cameraHeight;
    // this.camera.position.z = 1;
    // this.camera.lookAt(new Vector3(0, 0, 0));
    this.camera.updateProjectionMatrix();
    this.nodePost.setSize(w, h);
  }
}

export default Mito;
