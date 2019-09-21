import * as React from "react";
import * as THREE from "three";
import { OrthographicCamera, Scene, Vector2, WebGLRenderer } from "three";

import devlog from "../../common/devlog";
import { map, lerp2 } from "../../math/index";
import { ISketch, SketchAudioContext } from "../../sketch";
import { Action, ActionBuild, ActionBuildTransport, ActionMove } from "./action";
import { drums, hookUpAudio, strings } from "./audio";
import { Constructor } from "./constructor";
import { Player, World } from "./game";
import { Cell, Fruit, Root, Soil, Tile, Tissue, Transport, Vein } from "./game/tile";
import { ACTION_KEYMAP, BUILD_HOTKEYS, MOVEMENT_KEYS } from "./keymap";
import { params } from "./params";
import { actionMoveFor, findPositionsThroughNonObstacles, findPositionsThroughTissue, pathFrom } from "./pathfinding";
import { NewPlayerTutorial } from "./tutorial";
import { TutorialBuildRoot } from "./tutorial/tutorialBuildTissue";
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
  // when true, automatically create tissue tiles when walking into soil or dirt
  public autoplace: Constructor<Cell> | undefined;
  public render() {
    return <>
      <HUD
        autoplace={this.autoplace}
        mouseX={this.mouse.x}
        mouseY={this.mouse.y}
        uiState={this.uiState}
        isTutorialFinished={this.tutorialRef == null ? true : this.tutorialRef.isFinished()}
        sugar={this.world.player.inventory.sugar}
        water={this.world.player.inventory.water}
        onTryActionKey={this.tryAction}
        world={this.world}
      />
      <GameStack mito={this} state={this.gameState} />
      {/* <NewPlayerTutorial ref={(ref) => this.tutorialRef = ref } mito={this} />, */}
      <ParamsGUI />
      <Hover mito={this} />
    </>;
  }
  public tutorialRef: NewPlayerTutorial | null = null;
  public mouse = new THREE.Vector2();
  public highlightedTile?: Tile;
  private raycaster = new THREE.Raycaster();
  public gameState: GameState = "main";
  private firstActionTakenYet = false;
  public audioListener = new THREE.AudioListener();
  private keyMap = new Set<string>();
  public uiState: UIState = { type: "main" };

  private enterUIStateExpanding(target: THREE.Vector2) {
    const originalZoom = this.uiState.type === "main" ? this.camera.zoom : this.uiState.originalZoom;
    this.uiState = {
      type: "expanding",
      originalZoom,
      target,
    };
  }

  private resetUIState() {
    if (this.uiState.type === "expanding") {
      this.camera.zoom = this.uiState.originalZoom;
      this.camera.updateProjectionMatrix();
      this.uiState = { type: "main" };
    }
  }

  public events = {
    contextmenu: (event: MouseEvent) => {
      if (this.uiState.type === "main") {
        const tile = this.getHighlightedTile(event.clientX!, event.clientY!);
        if (tile != null) {
          this.world.player.setAction({
            type: "deconstruct",
            position: tile.pos,
          });
        }
      }
      event.preventDefault();
      return false;
    },
    mousemove: (event: MouseEvent) => {
      this.mouse.x = event.clientX!;
      this.mouse.y = event.clientY!;
    },
    click: (event: MouseEvent) => {
      // left-click
      this.handleClick(event.clientX!, event.clientY!);
    },
    keydown: (event: KeyboardEvent) => {
      this.firstActionTakenYet = true;
      const key = event.key!;
      this.keyMap.add(key);
      this.tryAction(key);
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

  tryAction = (key: string) => {
    if (key === "?") {
      this.gameState = (this.gameState === "instructions" ? "main" : "instructions");
      return;
    }
    if (this.uiState.type === "expanding") {
      if (key === "Escape") {
        this.resetUIState();
        return;
      }
      if (key in BUILD_HOTKEYS && !(BUILD_HOTKEYS[key] === Fruit && this.world.fruit != null)) {
        const cellType = BUILD_HOTKEYS[key];
        const buildAction: ActionBuild = {
          type: "build",
          cellType: cellType,
          position: this.uiState.target,
        };
        this.world.player.setAction(buildAction);
        this.resetUIState();
        return;
      } else if (ACTION_KEYMAP[key]) {
        this.resetUIState();
        return;
      }
    }
    if (this.gameState === "instructions") {
      if (key === "Escape") {
        this.gameState = "main";
      }
      // block further actions
      return;
    }
    if (this.autoplace != null && key === "Escape") {
      this.autoplace = undefined;
    }
    const action = ACTION_KEYMAP[key] || MOVEMENT_KEYS[key];
    if (action != null) {
      this.world.player.setAction(action);
    } else {
      if (key in BUILD_HOTKEYS) {
        if (this.autoplace === BUILD_HOTKEYS[key] || (BUILD_HOTKEYS[key] === Fruit && this.world.fruit != null)) {
          this.autoplace = undefined;
        } else {
          this.autoplace = BUILD_HOTKEYS[key];
        }
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
    this.resize(this.canvas.width, this.canvas.height);
    this.camera.add(this.audioListener);

    this.worldRenderer = new WorldRenderer(this.world, this.scene, this);

    // step once to get a StepStats
    this.world.step();
    this.world.player.mapActions = this.mapActions;

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

    this.world.player.suckWater = !this.keyMap.has("j");
    this.world.player.suckSugar = !this.keyMap.has("k");
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

    // if (offset.length() > 0.75) {
    //   offset.setLength(0.75);
    // }
    const {x, y} = this.world.player.posFloat;

    offset.x += x;
    offset.y += y;
    return offset;
  }

  private getHighlightedTile(clientX: number, clientY: number) {
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
    this.highlightedTile = this.getHighlightedTile(this.mouse.x, this.mouse.y);
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

  // if this move, taken by Player, doesn't make sense, then take an action that does
  public mapActions = (player: Player, action: Action): Action | Action[] | undefined => {
    if (action == null) {
      return;
    }
    if (action.type === "none") {
      return action;
    }
    this.resetUIState();
    if (action.type === "still" && (this.autoplace === Vein || this.autoplace === Tissue)) {
      return {
        type: "build",
        cellType: this.autoplace,
        position: player.pos,
      };
    }
    if (action.type !== "move") {
      return action;
    }
    const targetTile = this.world.tileAt(player.pos.x + action.dir.x, player.pos.y + action.dir.y);
    const currentTile = player.currentTile();
    // autoplace
    if (this.autoplace != null) {
      if (this.autoplace === Transport) {
        if (action.dir == null) { throw new Error("bad dir"); }
        const buildTransportAction: ActionBuildTransport = {
          type: "build-transport",
          cellType: Transport,
          position: this.world.player.pos,
          dir: action.dir,
        };
        return buildTransportAction;
      } else if (this.autoplace === Vein && !(currentTile instanceof Vein)) {
        return {
          type: "multiple",
          actions: [
            {
              type: "build",
              cellType: Vein,
              position: player.pos,
            },
            action,
          ],
        };
      } else if (!player.verifyMove(action)) {
        const buildAction: ActionBuild = {
          type: "build",
          cellType: this.autoplace,
          position: player.pos.clone().add(action.dir),
        };
        if (this.autoplace !== Tissue && this.autoplace !== Root) {
          this.autoplace = undefined;
        }
        return buildAction;
      } else {
        return action;
      }
    } else if (player.isBuildCandidate(targetTile)) {
      if (this.tutorialRef != null) {
        // we're in root tutorial
        if (this.tutorialRef.tutorialRef instanceof TutorialBuildRoot) {
          // only allow building on the soil
          if (!(targetTile instanceof Soil)) {
            return;
          }
        }
      }
      // we attempt to move into a place we cannot
      // this.enterUIStateExpanding(targetTile.pos);
      return;
    } else {
      return action;
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

  public handleClick(clientX: number, clientY: number) {
    this.firstActionTakenYet = true;
    const target = this.getHighlightedTile(clientX, clientY);
    if (this.uiState.type === "expanding") {
      if (target == null || !this.uiState.target.equals(target.pos)) {
        this.resetUIState();
      }
    }
    if (!target) {
      return;
    }

    // clicking self means "be still".
    if (target.pos.equals(this.world.player.pos)) {
      this.world.player.setAction({ type: "still" });
      return;
    }

    // clicking an adjacent tile means walk there, allowing for walking past the edge
    const singleMove = actionMoveFor(this.world.player.pos.x, this.world.player.pos.y, target.pos.x, target.pos.y);
    if (singleMove) {
      if (this.world.player.isBuildCandidate(target)) {
        this.enterUIStateExpanding(target.pos);
        return;
      } else {
        this.world.player.setAction(singleMove);
        return;
      }
    }

    // now we're clicking past an adjacent tile. find a path.
    let actions: Action[];
    // Tissue and Vein are common tiles you use to expand with (two types of roads)
    // when we're autoplacing those, allow building far away
    if (this.autoplace && Mito.expansionTiles.indexOf(this.autoplace) !== -1) {
      actions = pathFrom(findPositionsThroughNonObstacles(this.world, target.pos));
    } else {
      actions = pathFrom(findPositionsThroughTissue(this.world, target.pos, this.autoplace != null));
    }
    this.world.player.setActions(actions);
  }
  static expansionTiles: Array<Constructor<Cell>> = [Tissue, Root, Vein];
}

export default Mito;
