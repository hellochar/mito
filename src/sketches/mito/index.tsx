import * as React from "react";
import * as THREE from "three";
import { OrthographicCamera, Scene, Vector2, WebGLRenderer, Vector3 } from "three";

import { parse } from "query-string";

import { map, lerp2 } from "../../math/index";
import { ISketch, SketchAudioContext } from "../sketch";
import { ActionBuild, ActionMove } from "./action";
import { drums, hookUpAudio, strings } from "./audio";
import { Constructor } from "./constructor";
import { World, TIME_PER_SEASON } from "./game";
import { Cell, Fruit, Root, Tissue, Transport, Vein, Leaf, Tile } from "./game/tile";
import { ACTION_KEYMAP, MOVEMENT_KEYS } from "./keymap";
import { params } from "./params";
import { NewPlayerTutorial } from "./tutorial";
import { GameStack, Hover, HUD } from "./ui";
import { WorldRenderer } from "./renderers/WorldRenderer";
import { HexTile } from "../../overworld/hexTile";
import { Species } from "../../evolution/species";
import VignetteCapturer from "common/vignette";
import { TileRenderer } from "./renderers/TileRenderer";

export interface GameResult {
  status: "won" | "lost";
  fruits: Fruit[];
  world: World;
}

export class WorldDOMElement {
  constructor(public mito: Mito, public positionFn: () => Vector2, public renderFn: () => JSX.Element) { }

  render() {
    const worldPosition = this.positionFn();
    const pixelPosition = this.mito.worldToScreen(worldPosition);
    const left = pixelPosition.x;
    const top = pixelPosition.y;
    const style: React.CSSProperties = {
      left,
      top,
    };
    return <div style={style}>{this.renderFn()}</div>;
  }
}

export class Mito extends ISketch {
  public readonly world: World;
  public scene = new Scene();
  private camera = new OrthographicCamera(0, 0, 0, 0, -100, 100);
  public cellBar: Constructor<Cell>[] = [Tissue, Leaf, Root, Transport, Fruit];
  public cellBarIndex = 0;
  public tutorialRef: NewPlayerTutorial | null = null;
  public mouse = new THREE.Vector2();
  public mouseDown = false;
  public mouseButton = -1;
  public instructionsOpen = false;
  private firstActionTakenYet = false;
  public audioListener = new THREE.AudioListener();
  private keyMap = new Set<string>();
  public highlightedTile?: Tile;

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
      const code = event.code;
      this.keyMap.add(code);
      if (!event.repeat) {
        this.handleKeyDown(code);
      }
    },
    keyup: (event: KeyboardEvent) => {
      this.keyMap.delete(event.code);
    },
    wheel: (e: WheelEvent) => {
      if (e.shiftKey) {
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
      } else {
        if (e.deltaX + e.deltaY < 0) {
          this.setCellBarIndex(this.cellBarIndex - 1);
        } else {
          this.setCellBarIndex(this.cellBarIndex + 1);
        }
      }
    },
  };

  get selectedCell() {
    return this.cellBar[this.cellBarIndex];
  }

  private worldRenderer: WorldRenderer;
  private vignetteCapturer = new VignetteCapturer(this);
  private vignettes: HTMLCanvasElement[] = [];

  constructor(
    renderer: WebGLRenderer,
    context: SketchAudioContext,
    level: HexTile,
    species: Species,
    public onWinLoss: (result: GameResult) => void
  ) {
    super(renderer, context);
    if (level.info.world == null) {
      level.info.world = new World(level.info.environment!, species);
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
    this.attachWindowEvents();
    (window as any).mito = this;
    (window as any).THREE = THREE;
  }

  private attachWindowEvents() {
    window.addEventListener("blur", () => {
      this.keyMap.clear();
    });
  }

  handleKeyDown = (key: string) => {
    if (key === "?") {
      this.instructionsOpen = !this.instructionsOpen;
      return;
    }
    if (this.instructionsOpen) {
      if (key === "Escape") {
        this.instructionsOpen = false;
      }
      return;
    }

    if (["1", "2", "3", "4", "5"].indexOf(key) !== -1) {
      const index = key.charCodeAt(0) - "1".charCodeAt(0);
      this.cellBarIndex = index;
    }
  };

  public setCellBarIndex(i: number) {
    this.cellBarIndex = ((i % this.cellBar.length) + this.cellBar.length) % this.cellBar.length;
  }

  public render() {
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
        <div className="world-dom-components">{worldDomElementComponents}</div>
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

  public worldStep() {
    if (!this.firstActionTakenYet || this.instructionsOpen) {
      return;
    }

    // this.world.player.dropWater = this.keyMap.has("q");
    // this.world.player.dropSugar = this.keyMap.has("e");
    this.world.step();

    if (this.world.time % (TIME_PER_SEASON / 27) === 0) {
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

  public getHighlightVector(clientX = this.mouse.x, clientY = this.mouse.y) {
    const offset = new Vector2(clientX - this.canvas.width / 2, clientY - this.canvas.height / 2);

    offset.setLength(0.75);
    return offset;
  }

  public getHighlightPosition(clientX = this.mouse.x, clientY = this.mouse.y) {
    const offset = this.getHighlightVector(clientX, clientY);
    const { x, y } = this.world.player.posFloat;

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

  worldToScreen(world: Vector2) {
    const screen = new Vector3(world.x, world.y, 0);
    screen.project(this.camera); // `camera` is a THREE.PerspectiveCamera

    screen.x = Math.round((0.5 + screen.x / 2) * this.canvas.width);
    screen.y = Math.round((0.5 - screen.y / 2) * this.canvas.height);

    return screen;
  }

  private worldDomElements = new Set<WorldDOMElement>();
  addWorldDOMElement(positionFn: () => THREE.Vector2, renderFn: () => JSX.Element): WorldDOMElement {
    const e = new WorldDOMElement(this, positionFn, renderFn);
    this.worldDomElements.add(e);
    return e;
  }

  removeWorldDOMElement(worldDomElement: WorldDOMElement) {
    this.worldDomElements.delete(worldDomElement);
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
    if (this.instructionsOpen) {
      return;
    }
    // if (document.activeElement !== this.canvas && !document.querySelector(".dg.ac")!.contains(document.activeElement)) {
    //     this.canvas.focus();
    // }
    this.canvas.focus();
    if (params.isRealtime) {
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
      this.worldStep();
    } else if (this.world.player.getAction() != null) {
      this.worldStep();
    }
    this.worldRenderer.update();

    this.highlightedTile = this.getHighlightedTile();
    if (this.highlightedTile != null) {
      (this.worldRenderer.getOrCreateRenderer(this.highlightedTile) as TileRenderer).updateHover();
    }

    const mouseNorm = this.getCameraNormCoordinates(this.mouse.x, this.mouse.y);
    const target = new THREE.Vector2(
      this.world.player.posFloat.x + mouseNorm.x / 2,
      this.world.player.posFloat.y - mouseNorm.y / 2
    );
    lerp2(this.camera.position, target, 0.3);

    this.renderer.render(this.scene, this.camera);
    if (Boolean(parse(window.location.search).debug) && this.frameCount % 100 === 0) {
      // this.perfDebug();
      this.logRenderInfo();
    }
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
      if (tile instanceof Fruit) {
        return; // disallow deleting fruit
      }
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

    // clicking a build candidate will try to build with the currently selected cell
    if (this.world.player.isBuildCandidate(target)) {
      const args: any[] = [];
      if (this.selectedCell === Transport) {
        const highlightVector = this.getHighlightVector();
        const roundedHighlightVector = highlightVector.setLength(1).round();
        args.push(roundedHighlightVector);
      }
      const action: ActionBuild = {
        type: "build",
        cellType: this.selectedCell,
        position: target.pos.clone(),
        args,
      };
      this.world.player.setAction(action);
    }
  }
  static expansionTiles: Array<Constructor<Cell>> = [Tissue, Root, Vein];
}

export default Mito;
