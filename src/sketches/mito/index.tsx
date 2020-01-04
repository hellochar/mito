import { PopulationAttempt } from "app";
import VignetteCapturer from "common/vignette";
import * as React from "react";
import * as THREE from "three";
import { OrthographicCamera, PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { lerp, lerp2, map } from "../../math/index";
import { ISketch, SketchAudioContext } from "../sketch";
import { ActionMove } from "./action";
import { CellBar, InteractBar, SwitchableBar } from "./actionBar";
import { drums, hookUpAudio, strings } from "./audio";
import { World } from "./game";
import { environmentFromLevelInfo } from "./game/environment";
import { Fruit, Tile } from "./game/tile";
import { ACTION_KEYMAP, MOVEMENT_KEYS } from "./keymap";
import { params } from "./params";
import { InstancedTileRenderer } from "./renderers/tile/InstancedTileRenderer";
import { WorldRenderer } from "./renderers/WorldRenderer";
import { NewPlayerTutorial } from "./tutorial";
import { GameStack, Hover, HUD } from "./ui";
import Debug from "./ui/Debug";
import { Instructions } from "./ui/Instructions";
import { WorldDOMElement } from "./WorldDOMElement";

export interface GameResult {
  status: "won" | "lost";
  fruits: Fruit[];
  mutationPointsPerEpoch: number;
  world: World;
}

export interface CameraState {
  center: THREE.Vector2;
  zoom: number;
}

export class Mito extends ISketch {
  static id = "mito";
  public readonly world: World;
  public readonly actionBar: SwitchableBar;
  public readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(0, 0, 0, 0, -100, 100);
  public tutorialRef: NewPlayerTutorial | null = null;
  public readonly mouse = new THREE.Vector2();
  public mouseDown = false;
  public mouseButton = -1;
  public instructionsOpen = false;
  private firstActionTakenYet = false;
  public readonly audioListener = new THREE.AudioListener();
  private readonly keyMap = new Set<string>();
  public highlightedTile?: Tile;
  public readonly worldRenderer: WorldRenderer;
  private vignetteCapturer = new VignetteCapturer(this);
  private vignettes: HTMLCanvasElement[] = [];

  private hackCamera?: PerspectiveCamera;
  private controls?: OrbitControls;

  private suggestedCamera?: CameraState;
  private userZoom: number;

  constructor(
    renderer: WebGLRenderer,
    context: SketchAudioContext,
    attempt: PopulationAttempt,
    public onWinLoss: (result: GameResult) => void
  ) {
    super(renderer, context);
    const { info } = attempt.targetHex;
    this.world = new World(environmentFromLevelInfo(info), info.seed, attempt.settlingSpecies);

    this.camera.position.z = 10;
    this.camera.lookAt(0, 0, 0);
    this.camera.position.x = this.world.player.pos.x;
    this.camera.position.y = this.world.player.pos.y;
    this.camera.zoom = this.userZoom = 1.5;
    this.camera.add(this.audioListener);

    // this.hackCamera = new PerspectiveCamera(60, this.canvas.height / this.canvas.width);
    // this.hackCamera.position.copy(this.camera.position);
    // this.hackCamera.lookAt(0, 0, 0);
    if (this.hackCamera != null) {
      this.controls = new OrbitControls(this.hackCamera);
      this.scene.add(new THREE.AxesHelper(25));
    }

    this.worldRenderer = new WorldRenderer(this.world, this.scene, this);

    hookUpAudio(this.audioContext);
    this.updateAmbientAudio();
    this.attachWindowEvents();

    this.actionBar = new SwitchableBar(new CellBar(this), new InteractBar(this));
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
    },
    mouseup: () => {
      this.mouseDown = false;
    },
    wheel: (e: WheelEvent) => {
      // if (e.shiftKey) {
      // on my mouse, one scroll is + or - 125
      const delta = -(e.deltaX + e.deltaY) / 125 / 20;
      const currZoom = this.userZoom;
      const scalar = Math.pow(2, delta);
      // console.log(currZoom);
      // zoom of 2 is zooming in
      // const newZoom = Math.min(Math.max(currZoom * scalar, 1), 2.5);
      const newZoom = currZoom * scalar;
      this.userZoom = newZoom;
      // } else {
      //   if (e.deltaX + e.deltaY < 0) {
      //     this.setCellBarIndex(this.cellBarIndex - 1);
      //   } else {
      //     this.setCellBarIndex(this.cellBarIndex + 1);
      //   }
      // }
    },
  };
  private handleKeyDown = (event: KeyboardEvent) => {
    this.firstActionTakenYet = true;
    const code = event.code;
    this.keyMap.add(code);
    if (!event.repeat) {
      this.toggleInstructions(code);
    }
    this.actionBar.keyDown(event);
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keyMap.delete(event.code);
  };

  private handleBlur = () => {
    this.keyMap.clear();
  };

  private handleBeforeUnload = () => {
    return true;
  };

  private attachWindowEvents() {
    window.addEventListener("blur", () => this.handleBlur);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.onbeforeunload = this.handleBeforeUnload;
    (window as any).mito = this;
    (window as any).THREE = THREE;
  }

  destroy() {
    window.removeEventListener("blur", this.handleBlur);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.onbeforeunload = null;
  }

  public render() {
    if (!params.hud) {
      return null;
    }
    const worldDomElementComponents: JSX.Element[] = [];
    for (const e of this.worldDomElements) {
      worldDomElementComponents.push(e.render());
    }
    return (
      <>
        <HUD mito={this} />
        <GameStack mito={this} />
        {/* <NewPlayerTutorial ref={(ref) => this.tutorialRef = ref } mito={this} />, */}
        {/* <ParamsGUI /> */}
        <Hover mito={this} />
        {/* <div className="hud-top-left">
          <TileDetails tile={this.highlightedTile} />
        </div> */}
        <div className="world-dom-components">{worldDomElementComponents}</div>
        {params.debug ? <Debug mito={this} /> : null}
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

  toggleInstructions(code: string) {
    if (code === "Slash") {
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

  public logRenderInfo() {
    console.log(
      `Geometries in memory: ${this.renderer.info.memory.geometries}
Textures in memory: ${this.renderer.info.memory.textures}
Number of Programs: ${this.renderer.info.programs!.length}
# Render Calls: ${this.renderer.info.render.calls}
# Render Lines: ${this.renderer.info.render.lines}
# Render Points: ${this.renderer.info.render.points}
# Render Tris: ${this.renderer.info.render.triangles}
`
    );
  }

  public perfDebug() {
    // count how many have autoUpdate enabled
    let yes = 0,
      no = 0;
    this.scene.traverse((o) => {
      if (o.matrixAutoUpdate) {
        yes++;
      } else {
        no++;
      }
    });
    console.log("matrixAutoUpdate: yes", yes, ", no", no);

    // count how many vertices of each type there are
    const s = new Map();
    this.scene.traverse((o) => {
      const k = s.get(o.name || o.constructor.name) || [];
      s.set(o.name || o.constructor.name, k);
      k.push(o);
    });
    console.log(s);
  }

  public worldStep(dt: number) {
    if (!this.firstActionTakenYet || this.instructionsOpen) {
      return;
    }

    // this.world.player.dropWater = this.keyMap.has("q");
    // this.world.player.dropSugar = this.keyMap.has("e");
    this.world.step(dt);

    if (this.vignetteCapturer.isTimeForNewCapture()) {
      const v = this.vignetteCapturer.capture();
      this.vignettes.push(v);
    }

    if (this.tutorialRef) {
      this.tutorialRef.setState({ time: this.world.time });
    }

    const gameResult = this.world.maybeGetGameResult();
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
    offset.clampLength(0, 0.75);
    return offset;
  }

  public getHighlightPosition(clientX = this.mouse.x, clientY = this.mouse.y) {
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

  private getHighlightedTile(clientX = this.mouse.x, clientY = this.mouse.y) {
    const p = this.getHighlightPosition(clientX, clientY);
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
  addWorldDOMElement(positionFn: () => THREE.Vector2 | Tile, renderFn: () => JSX.Element): WorldDOMElement {
    const e = new WorldDOMElement(this, positionFn, renderFn);
    this.worldDomElements.add(e);
    return e;
  }

  removeWorldDOMElement(worldDomElement: WorldDOMElement) {
    this.worldDomElements.delete(worldDomElement);
  }

  public animate(millisElapsed: number) {
    if (this.instructionsOpen) {
      return;
    }
    this.canvas.focus();
    const moveAction = this.keysToMovement(this.keyMap);
    if (moveAction) {
      this.world.player.setAction(moveAction);
    }
    for (const key of this.keyMap) {
      if (ACTION_KEYMAP[key]) {
        this.world.player.setAction(ACTION_KEYMAP[key]);
      }
    }
    if (this.mouseDown) {
      // left
      if (this.mouseButton === 0) {
        this.handleLeftClick();
      } else if (this.mouseButton === 2) {
        this.handleRightClick();
      }
    }

    // cap out at 1/3rd of a second in one frame (about 10 frames)
    const dt = Math.min(millisElapsed / 1000, 1 / 3);
    this.worldStep(dt);
    this.worldRenderer.update();

    this.highlightedTile = this.getHighlightedTile();
    // console.log(this.highlightedTile!.pos);
    if (this.highlightedTile != null) {
      (this.worldRenderer.getOrCreateRenderer(this.highlightedTile) as InstancedTileRenderer).updateHover();
    }

    this.updateCamera(this.suggestedCamera || this.defaultCameraState());

    this.suggestedCamera = undefined;

    if (this.hackCamera != null) {
      this.renderer.render(this.scene, this.hackCamera);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    // if (params.debug && this.frameCount % 100 === 0) {
    // this.perfDebug();
    // this.logRenderInfo();
    // }
  }

  defaultCameraState(): CameraState {
    const mouseNorm = this.getCameraNormCoordinates(this.mouse.x, this.mouse.y);

    const cameraTarget = new THREE.Vector2(
      this.world.player.posFloat.x + mouseNorm.x / 2,
      this.world.player.posFloat.y - mouseNorm.y / 2
    );
    const nearbyFruits = this.world.wipResult.fruits.filter(
      (f) => f.pos.distanceTo(cameraTarget) < 12 / this.camera.zoom
    );
    if (nearbyFruits.length > 0) {
      const nearbyFruitsCenter = nearbyFruits
        .map((f) => f.pos)
        .reduce((v, p) => v.add(p), new Vector2())
        .divideScalar(nearbyFruits.length);
      lerp2(cameraTarget, nearbyFruitsCenter, 0.25);
    }

    return {
      center: cameraTarget,
      zoom: this.userZoom,
    };
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

  public keysToMovement(keys: Set<string>): ActionMove | null {
    const dir = new Vector2();
    for (const key of keys) {
      if (MOVEMENT_KEYS[key]) {
        dir.add(MOVEMENT_KEYS[key].dir);
      }
    }
    if (dir.x === 0 && dir.y === 0) {
      return null;
    } else {
      return {
        type: "move",
        dir,
      };
    }
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
  }

  public handleRightClick() {
    const tile = this.getHighlightedTile();
    if (tile == null) {
      return;
    }
    this.actionBar.rightClick(tile);
  }

  public handleLeftClick() {
    this.firstActionTakenYet = true;
    const target = this.getHighlightedTile();
    if (target == null) {
      return;
    }
    this.actionBar.leftClick(target);
  }
}

export default Mito;
