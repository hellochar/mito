import classNames from "classnames";
import configure from "common/configure";
import { Cell, CellType, GeneInstance } from "core/cell";
import { Directions, DIRECTIONS, oppositeDir } from "core/directions";
import { clickGeneric, playSmallRand } from "game/audio";
import Keyboard from "game/input/keyboard";
import { WorldDOMElement } from "game/mito/WorldDOMElement";
import React, { useCallback } from "react";
import { IoIosClose } from "react-icons/io";
import { GenePipes } from "std/genes/GenePipes";
import { BoxBufferGeometry, Color, DoubleSide, Mesh, MeshBasicMaterial } from "three";
import "./GenePipesRenderer.scss";
import { GeneRenderer } from "./GeneRenderer";
import { BLACK } from "./tileBatcher";

const PIPE_DIR_GEOMETRY = new BoxBufferGeometry(0.4, 0.2);
const PIPE_CENTER_GEOMETRY = new BoxBufferGeometry(0.2, 0.2);

const materialMap = new Map<CellType, MeshBasicMaterial>();
function getPipeMaterial(cellType: CellType) {
  if (!materialMap.has(cellType)) {
    const color = new Color(cellType.material.color?.getHex() ?? 0xffffff);
    color.lerp(BLACK, 0.5);
    materialMap.set(
      cellType,
      new MeshBasicMaterial({
        color,
        side: DoubleSide,
        opacity: 0.5,
        transparent: true,
      })
    );
  }
  return materialMap.get(cellType);
}

export class GenePipesRenderer extends GeneRenderer<GenePipes> {
  public meshes: Partial<Record<Directions, Mesh>> = {};

  public zeroMesh = configure(new Mesh(PIPE_CENTER_GEOMETRY, getPipeMaterial(this.target.cell.type)), (mesh) => {
    mesh.name = `Pipe Center`;
    mesh.position.x = this.target.cell.pos.x;
    mesh.position.y = this.target.cell.pos.y;
    mesh.position.z = 1;
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
    this.scene.add(mesh);
  });

  private argsEditor?: WorldDOMElement;

  update() {
    const { connections } = this.target.state;
    let direction: Directions;
    for (direction in this.target.state.connections) {
      if (connections[direction] && this.meshes[direction] == null) {
        this.addMesh(direction);
      } else if (!connections[direction] && this.meshes[direction] != null) {
        this.removeMesh(direction);
      }
    }

    if (this.tileRenderer.worldRenderer.renderResources) {
      this.updateArgsEditor();
    }
  }

  private addMesh(dir: Directions) {
    const mesh = (this.meshes[dir] = new Mesh(PIPE_DIR_GEOMETRY, getPipeMaterial(this.target.cell.type)));
    mesh.name = `Pipe ${dir}`;
    const direction = DIRECTIONS[dir];
    mesh.position.x = this.target.cell.pos.x + direction.x * 0.3;
    mesh.position.y = this.target.cell.pos.y + direction.y * 0.3;
    mesh.position.z = 1;
    mesh.rotation.z = direction.angle();
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
    this.scene.add(mesh);
  }

  private removeMesh(directionName: Directions) {
    const mesh = this.meshes[directionName]!;
    delete this.meshes[directionName];
    this.scene.remove(mesh);
  }

  updateArgsEditor() {
    const shouldShowArgsEditor = Keyboard.keyMap.has("ShiftLeft") && this.mito.getTileAtScreen() === this.target.cell;
    if (shouldShowArgsEditor && this.argsEditor == null) {
      this.argsEditor = this.mito.addWorldDOMElement(this.positionFn, this.renderFn);
    } else if (!shouldShowArgsEditor && this.argsEditor != null) {
      this.mito.removeWorldDOMElement(this.argsEditor);
      this.argsEditor = undefined;
    }
  }

  private positionFn = () => this.target.cell;

  private renderFn = () => {
    return <PipesEditor gene={this.target} />;
  };

  hover() {}

  destroy() {
    if (this.argsEditor) {
      this.mito.removeWorldDOMElement(this.argsEditor);
    }
    let dir: Directions;
    for (dir in this.meshes) {
      const mesh = this.meshes[dir];
      if (mesh != null) {
        this.scene.remove(mesh);
      }
    }
    this.scene.remove(this.zeroMesh);
  }
}

function setPipe(gene: GeneInstance<GenePipes>, dir: Directions, val: boolean | "flip", silent = false) {
  const { connections } = gene.state;
  if (val === "flip") {
    val = !connections[dir];
  }
  if (connections[dir] !== val && !silent) {
    playSmallRand(clickGeneric);
  }
  connections[dir] = val;
  // also set neighbor's connecting pipe
  const neighbor = gene.cell.world.tileNeighbors(gene.cell.pos).get(DIRECTIONS[dir]);
  if (neighbor instanceof Cell) {
    const neighborPipes = neighbor.findGene(GenePipes);
    if (neighborPipes != null) {
      neighborPipes.state.connections[oppositeDir(dir)] = val;
    }
  }

  return val;
}

function setAllPipes(gene: GeneInstance<GenePipes>, off: boolean) {
  if (off) {
    if (isAnyOn(gene)) {
      playSmallRand(clickGeneric);
    }
    setPipe(gene, "n", false, true);
    setPipe(gene, "s", false, true);
    setPipe(gene, "e", false, true);
    setPipe(gene, "w", false, true);
    lastEventStateType = "all-false";
  } else {
    if (!isAnyOn(gene)) {
      playSmallRand(clickGeneric);
    }
    setPipe(gene, "n", true, true);
    setPipe(gene, "s", true, true);
    setPipe(gene, "e", true, true);
    setPipe(gene, "w", true, true);
    lastEventStateType = "all-true";
  }
}

let lastEventStateType: "set-true" | "set-false" | "all-true" | "all-false" | undefined;

function handleMouseDown(gene: GeneInstance<GenePipes>, dir: Directions) {
  const val = setPipe(gene, dir, "flip");
  lastEventStateType = val ? "set-true" : "set-false";
}

function handleMouseMove(event: React.MouseEvent, gene: GeneInstance<GenePipes>, dir: Directions) {
  if (event.buttons > 0) {
    if (lastEventStateType === "set-true") {
      setPipe(gene, dir, true);
    } else if (lastEventStateType === "set-false") {
      setPipe(gene, dir, false);
    } else if (lastEventStateType === "all-false") {
      setAllPipes(gene, true);
    } else if (lastEventStateType === "all-true") {
      setAllPipes(gene, false);
    }
  }
}

function isAnyOn(gene: GeneInstance<GenePipes>) {
  const { connections } = gene.state;
  return !!(connections.n || connections.s || connections.e || connections.w);
}

const PipesEditor: React.FC<{ gene: GeneInstance<GenePipes> }> = ({ gene }) => {
  const setDirN = useCallback(() => handleMouseDown(gene, "n"), [gene]);
  const setDirS = useCallback(() => handleMouseDown(gene, "s"), [gene]);
  const setDirE = useCallback(() => handleMouseDown(gene, "e"), [gene]);
  const setDirW = useCallback(() => handleMouseDown(gene, "w"), [gene]);

  const mouseMoveDirN = useCallback((event) => handleMouseMove(event, gene, "n"), [gene]);
  const mouseMoveDirS = useCallback((event) => handleMouseMove(event, gene, "s"), [gene]);
  const mouseMoveDirE = useCallback((event) => handleMouseMove(event, gene, "e"), [gene]);
  const mouseMoveDirW = useCallback((event) => handleMouseMove(event, gene, "w"), [gene]);

  let shouldClickTurnOff = isAnyOn(gene);
  const toggleAllDirections = useCallback(() => {
    setAllPipes(gene, shouldClickTurnOff);
  }, [gene, shouldClickTurnOff]);
  const mouseMoveAllDirections = useCallback(
    (event) => {
      if (event.buttons > 0) {
        if (lastEventStateType === "all-false") {
          setAllPipes(gene, true);
        } else {
          setAllPipes(gene, false);
        }
      }
    },
    [gene]
  );

  return (
    <div className="pipes-editor">
      <div className="zone-n" onMouseDown={setDirN} onMouseMove={mouseMoveDirN}></div>
      <div className="zone-w" onMouseDown={setDirW} onMouseMove={mouseMoveDirW}></div>
      <div
        className={classNames("zone-center", { "turn-on": !shouldClickTurnOff })}
        onMouseDown={toggleAllDirections}
        onMouseMove={mouseMoveAllDirections}
      >
        <IoIosClose />
      </div>
      <div className="zone-e" onMouseDown={setDirE} onMouseMove={mouseMoveDirE}></div>
      <div className="zone-s" onMouseDown={setDirS} onMouseMove={mouseMoveDirS}></div>
    </div>
  );
};
