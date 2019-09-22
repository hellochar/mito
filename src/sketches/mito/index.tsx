import * as React from "react";
import * as THREE from "three";
import { OrthographicCamera, Scene, Vector2, WebGLRenderer } from "three";

import devlog from "../../common/devlog";
import { map, lerp2 } from "../../math/index";
import { ISketch, SketchAudioContext } from "../../sketch";
import { ActionBuild, ActionMove } from "./action";
import { drums, hookUpAudio, strings } from "./audio";
import { Constructor } from "./constructor";
import { World } from "./game";
import { Cell, Fruit, Root, Tissue, Transport, Vein, Leaf, Tile } from "./game/tile";
import { ACTION_KEYMAP, MOVEMENT_KEYS } from "./keymap";
import { params } from "./params";
import { NewPlayerTutorial } from "./tutorial";
import { GameStack, Hover, HUD, ParamsGUI } from "./ui";
import { WorldRenderer } from "./renderers/WorldRenderer";
import { HexTile } from "../../overworld/hexTile";

export type GameState = "main" | "win" | "lose" | "instructions";

export interface UIStateMain {
  type: "main";
}
export interface UIStateExpanding {
  type: "expanding";
  originalZoom: number;
  target: THREE.Vector2;
}
export type UIState = UIStateMain | UIStateExpanding;

export class Mito extends ISketch {
  public readonly world: World;
  public scene = new Scene();
  private camera = new OrthographicCamera(0, 0, 0, 0, -100, 100);

  public cellBar: Constructor<Cell>[] = [Tissue, Leaf, Root, Transport, Fruit];
  public cellBarIndex = 0;
  get selectedCell() {
    return this.cellBar[this.cellBarIndex];
  }

  public render() {
    return <>
      <HUD mito={this} />
      <GameStack mito={this} state={this.gameState} />
      {/* <NewPlayerTutorial ref={(ref) => this.tutorialRef = ref } mito={this} />, */}
      <ParamsGUI />
      <Hover mito={this} />
    </>;
  }
  public tutorialRef: NewPlayerTutorial | null = null;
  public mouse = new THREE.Vector2();
  public mouseDown = false;
  public mouseButton = -1;
  public highlightedTile?: Tile;
  public gameState: GameState = "main";
  private firstActionTakenYet = false;
  public audioListener = new THREE.AudioListener();
  private keyMap = new Set<string>();
  public uiState: UIState = { type: "main" };


  private resetUIState() {
    if (this.uiState.type === "expanding") {
      this.camera.zoom = this.uiState.originalZoom;
      this.camera.updateProjectionMatrix();
      this.uiState = { type: "main" };
    }
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
    click: () => {
      // left-click
      // this.handleClick(event.clientX!, event.clientY!);
    },
    mousedown: (event: MouseEvent) => {
      this.mouseButton = event.button;
      this.mouseDown = true;
    },
    mouseup: () => {
      this.mouseDown = false;
    },
    keydown: (event: KeyboardEvent) => {
      this.firstActionTakenYet = true;
      const key = event.key!;
      this.keyMap.add(key);
      if (!event.repeat) {
        this.handleKeyDown(key);
      }
    },
    keyup: (event: KeyboardEvent) => {
      this.keyMap.delete(event.key!);
    },
    wheel: (e: WheelEvent) => {
      // on my mouse, one scroll is + or - 125
      const delta = -(e.deltaX + e.deltaY) / 125 / 20;
      const currZoom = this.camera.zoom;
      const scalar = Math.pow(2, delta);
      // console.log(currZoom);
      // zoom of 2 is zooming in
      // const newZoom = Math.min(Math.max(currZoom * scalar, 1), 2.5);
      const newZoom = currZoom * scalar;
      this.camera.zoom = newZoom;
      this.camera.updateProjectionMatrix();
    },
  };

  handleKeyDown = (key: string) => {
    if (key === "?") {
      this.gameState = (this.gameState === "instructions" ? "main" : "instructions");
      return;
    }
    if (this.gameState === "instructions") {
      if (key === "Escape") {
        this.gameState = "main";
      }
      // block further actions
      return;
    }
    const action = ACTION_KEYMAP[key] || MOVEMENT_KEYS[key];
    if (action != null) {
      this.world.player.setAction(action);
    } else {
      if (['1', '2', '3', '4', '5'].indexOf(key) !== -1) {
        const index = key.charCodeAt(0) - '1'.charCodeAt(0);
        this.cellBarIndex = index;
      }
    }
  }

  private expandingTileHighlight = (() => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        color: "white",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      }),
    );
    return mesh;
  })();

  private worldRenderer: WorldRenderer;
  constructor(renderer: WebGLRenderer, context: SketchAudioContext, level: HexTile, public onWinLoss: (state: "win" | "lose") => void) {
    super(renderer, context);
    if (level.info.world == null) {
      level.info.world = new World(level.info.environment!);
    }
    this.world = level.info.world;

    this.camera.position.z = 10;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.camera.position.x = this.world.player.pos.x;
    this.camera.position.y = this.world.player.pos.y;
    this.camera.zoom = 1.5;
    this.camera.add(this.audioListener);

    this.worldRenderer = new WorldRenderer(this.world, this.scene, this);

    // step once to get a StepStats
    this.world.step();

    hookUpAudio(this.audioContext);
    this.updateAmbientAudio();
    (window as any).mito = this;
  }

  public updateAmbientAudio() {
    const yPos = this.world.player.pos.y;
    const drumVolume = map(yPos, this.world.height / 2, this.world.height, 0, 0.5);
    const stringsVolume = map(yPos, this.world.height / 2, 0, 0, 0.5);
    drums.gain.gain.value = Math.max(0, drumVolume);
    strings.gain.gain.value = Math.max(0, stringsVolume);
  }

  public logRenderInfo() {
    devlog(
      `Geometries in memory: ${this.renderer.info.memory.geometries}
Textures in memory: ${this.renderer.info.memory.textures}
# Render Calls: ${this.renderer.info.render.calls}
# Render Lines: ${this.renderer.info.render.lines}
# Render Points: ${this.renderer.info.render.points}
# Render Tris: ${this.renderer.info.render.triangles}
`,
    );
  }

  public perfDebug() {
    // count how many have autoUpdate enabled
    let yes = 0, no = 0; this.scene.traverse((o) => { if (o.matrixAutoUpdate) { yes++ } else { no++ } });
    console.log("yes", yes, "no", no);

    // count how many vertices of each type there are
    const s = new Map(); this.scene.traverse((o) => { const k = (s.get(o.name || o.constructor.name) || []); s.set(o.name || o.constructor.name, k); k.push(o) })
    console.log(s);
  }

  public worldStep() {
    if (!this.firstActionTakenYet) {
      return;
    }

    this.world.player.suckWater = !this.keyMap.has("q");
    this.world.player.suckSugar = !this.keyMap.has("e");
    this.world.step();

    if (this.tutorialRef) {
      this.tutorialRef.setState({ time: this.world.time });
    }
    if (this.gameState === "main") {
      this.gameState = this.world.checkWinLoss() || this.gameState;
      if (this.gameState === "win" || this.gameState === "lose") {
        this.onWinLoss(this.gameState);
      }
    }

    this.updateAmbientAudio();
  }

  private getCameraNormCoordinates(clientX: number, clientY: number) {
    return new THREE.Vector2(
      clientX / this.canvas.width * 2 - 1,
      -clientY / this.canvas.height * 2 + 1,
    );
  }

  public getHighlightPosition(clientX = this.mouse.x, clientY = this.mouse.y) {
    const offset = new Vector2(
      clientX - this.canvas.width / 2,
      clientY - this.canvas.height / 2,
    );

    offset.setLength(0.75);
    const {x, y} = this.world.player.posFloat;

    offset.x += x;
    offset.y += y;
    return offset;
  }

  private getHighlightedTile(clientX = this.mouse.x, clientY = this.mouse.y) {
    const p = this.getHighlightPosition(clientX, clientY);
    p.round();

    const tile = this.world.tileAt(p.x, p.y);
    if (tile != null && tile.lightAmount() > 0) {
      return tile;
    }
  }

  // private getTileAtScreenPosition(clientX: number, clientY: number) {
  //   const cameraNorm = this.getCameraNormCoordinates(clientX, clientY);
  //   this.raycaster.setFromCamera(cameraNorm, this.camera);

  //   const { x, y } = this.raycaster.ray.origin;
  //   const ix = Math.round(x);
  //   const iy = Math.round(y);
  //   const tile = this.world.tileAt(ix, iy);
  //   if (tile != null && tile.lightAmount() > 0) {
  //     return tile;
  //   }
  //   // }
  // }

  public animate() {
    const { world } = this;
    // if (document.activeElement !== this.canvas && !document.querySelector(".dg.ac")!.contains(document.activeElement)) {
    //     this.canvas.focus();
    // }
    this.canvas.focus();
    if (this.gameState === "main") {
      if (params.isRealtime) {
        const moveAction = this.keysToMovement(this.keyMap);
        if (moveAction) {
          this.world.player.setAction(moveAction);
        }
        if (this.mouseDown) {
          // left
          if (this.mouseButton === 0) {
            this.handleLeftClick();
          } else if (this.mouseButton === 2) {
            this.handleRightClick();
          }
        }
        this.worldStep();
      } else if (world.player.getAction() != null) {
        this.worldStep();
      }

      this.worldRenderer.update();
    }
    if (this.uiState.type === "expanding") {
      if (!this.world.player.isBuildCandidate(this.world.tileAt(this.uiState.target))) {
        this.resetUIState();
      }
    }
    const mouseNorm = this.getCameraNormCoordinates(this.mouse.x, this.mouse.y);
    if (this.uiState.type === "main") {
      this.scene.remove(this.expandingTileHighlight);
      const target = new THREE.Vector2(
        this.world.player.posFloat.x + mouseNorm.x / 2,
        this.world.player.posFloat.y - mouseNorm.y / 2,
      );
      lerp2(this.camera.position, target, 0.3);
    } else {
      this.scene.add(this.expandingTileHighlight);
      this.expandingTileHighlight.position.set(
        this.uiState.target.x,
        this.uiState.target.y,
        1,
      );
      const target = new THREE.Vector2(
        this.uiState.target.x,
        this.uiState.target.y,
      );
      lerp2(this.camera.position, target, 0.3);
    }

    this.renderer.render(this.scene, this.camera);

    // this.hoveredTile = this.getTileAtScreenPosition(this.mouse.x, this.mouse.y);
    this.highlightedTile = this.getHighlightedTile();
    // this.perfDebug();
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
    if (tile != null) {
      this.world.player.setAction({
        type: "deconstruct",
        position: tile.pos,
      });
    }
    // }
  }

  public handleLeftClick() {
    this.firstActionTakenYet = true;
    const target = this.getHighlightedTile();
    if (target == null) {
      return;
    }

    // clicking self means "be still".
    if (target.pos.equals(this.world.player.pos)) {
      this.world.player.setAction({ type: "still" });
      return;
    }

    // clicking a build candidate will try to build with the currently selected cell
    if (this.world.player.isBuildCandidate(target)) {
      const action: ActionBuild = {
        type: "build",
        cellType: this.selectedCell,
        position: target.pos.clone(),
      };
      this.world.player.setAction(action);
    }

  }
  static expansionTiles: Array<Constructor<Cell>> = [Tissue, Root, Vein];
}

export default Mito;
