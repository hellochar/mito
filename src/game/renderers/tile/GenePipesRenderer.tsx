import classNames from "classnames";
import configure from "common/configure";
import { CellType, GeneInstance } from "core/cell";
import { Directions, DIRECTIONS } from "core/directions";
import Keyboard from "game/input/keyboard";
import { WorldDOMElement } from "game/mito/WorldDOMElement";
import React, { useCallback } from "react";
import { IoIosClose } from "react-icons/io";
import { GenePipes, PipesConnections } from "std/genes/GenePipes";
import { BoxBufferGeometry, DoubleSide, Mesh, MeshBasicMaterial } from "three";
import "./GenePipesRenderer.scss";
import { GeneRenderer } from "./GeneRenderer";

const PIPE_DIR_GEOMETRY = new BoxBufferGeometry(0.4, 0.2);
const PIPE_CENTER_GEOMETRY = new BoxBufferGeometry(0.2, 0.2);

const materialMap = new Map<CellType, MeshBasicMaterial>();
function getPipeMaterial(cellType: CellType) {
  if (!materialMap.has(cellType)) {
    const color = cellType.material.color?.getHex() ?? 0xffffff;
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

let lastEventStateType: "set-true" | "set-false" | "all-true" | "all-false" | undefined;

function handleMouseDown(connections: PipesConnections, dir: Directions) {
  connections[dir] = !connections[dir];
  lastEventStateType = connections[dir] ? "set-true" : "set-false";
  console.log("setdircallback", dir, lastEventStateType);
}

function handleMouseMove(event: React.MouseEvent, connections: PipesConnections, dir: Directions) {
  if (event.buttons > 0) {
    if (lastEventStateType === "set-true") {
      connections[dir] = true;
    } else if (lastEventStateType === "set-false") {
      connections[dir] = false;
    }
  }
}

const PipesEditor: React.FC<{ gene: GeneInstance<GenePipes> }> = ({ gene }) => {
  const connections = gene.state.connections;
  const setDirN = useCallback(() => handleMouseDown(connections, "n"), [connections]);
  const setDirS = useCallback(() => handleMouseDown(connections, "s"), [connections]);
  const setDirE = useCallback(() => handleMouseDown(connections, "e"), [connections]);
  const setDirW = useCallback(() => handleMouseDown(connections, "w"), [connections]);

  const mouseMoveDirN = useCallback((event) => handleMouseMove(event, connections, "n"), [connections]);
  const mouseMoveDirS = useCallback((event) => handleMouseMove(event, connections, "s"), [connections]);
  const mouseMoveDirE = useCallback((event) => handleMouseMove(event, connections, "e"), [connections]);
  const mouseMoveDirW = useCallback((event) => handleMouseMove(event, connections, "w"), [connections]);

  let shouldClickTurnOff = connections.n || connections.s || connections.e || connections.w;
  const toggleAllDirections = useCallback(() => {
    if (shouldClickTurnOff) {
      connections.n = connections.s = connections.e = connections.w = false;
    } else {
      connections.n = connections.s = connections.e = connections.w = true;
    }
  }, [connections.e, connections.n, connections.s, connections.w, shouldClickTurnOff]);

  return (
    <div className="pipes-editor">
      <div className="zone-n" onMouseDown={setDirN} onMouseMove={mouseMoveDirN}></div>
      <div className="zone-w" onMouseDown={setDirW} onMouseMove={mouseMoveDirW}></div>
      <div className={classNames("zone-center", { "turn-on": !shouldClickTurnOff })} onClick={toggleAllDirections}>
        <IoIosClose />
      </div>
      <div className="zone-e" onMouseDown={setDirE} onMouseMove={mouseMoveDirE}></div>
      <div className="zone-s" onMouseDown={setDirS} onMouseMove={mouseMoveDirS}></div>
    </div>
  );
};
