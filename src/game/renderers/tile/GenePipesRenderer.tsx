import { CellType, GeneInstance } from "core/cell";
import { Directions, DIRECTIONS } from "core/directions";
import Keyboard from "game/input/keyboard";
import { WorldDOMElement } from "game/mito/WorldDOMElement";
import React, { useCallback } from "react";
import { IoIosClose } from "react-icons/io";
import { GenePipes } from "std/genes/GenePipes";
import { BoxBufferGeometry, DoubleSide, Mesh, MeshBasicMaterial } from "three";
import "./GenePipesRenderer.scss";
import { GeneRenderer } from "./GeneRenderer";

const geom = new BoxBufferGeometry(0.2, 0.1);

const materialMap = new Map<CellType, MeshBasicMaterial>();
function getPipeMaterial(cellType: CellType) {
  if (!materialMap.has(cellType)) {
    const color = cellType.material.color?.getHex() ?? 0xffffff;
    materialMap.set(
      cellType,
      new MeshBasicMaterial({
        color,
        side: DoubleSide,
      })
    );
  }
  return materialMap.get(cellType);
}

export class GenePipesRenderer extends GeneRenderer<GenePipes> {
  public meshes: Partial<Record<Directions, Mesh>> = {};

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

  private addMesh(directionName: Directions) {
    const mesh = (this.meshes[directionName] = new Mesh(geom, getPipeMaterial(this.target.cell.type)));
    const direction = DIRECTIONS[directionName];
    mesh.position.x = this.target.cell.pos.x + direction.x * 0.4;
    mesh.position.y = this.target.cell.pos.y + direction.y * 0.4;
    mesh.position.z = 2;
    mesh.rotation.z = direction.angle();
    this.scene.add(mesh);
  }

  private removeMesh(directionName: Directions) {
    const mesh = this.meshes[directionName]!;
    delete this.meshes[directionName];
    this.scene.remove(mesh);
  }

  updateArgsEditor() {
    const shouldShowArgsEditor =
      Keyboard.keyMap.has("ShiftLeft") &&
      this.mito.getTileAtScreen(this.mito.mouse.position.x, this.mito.mouse.position.y) === this.target.cell;
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
  }
}

const PipesEditor: React.FC<{ gene: GeneInstance<GenePipes> }> = ({ gene }) => {
  const connections = gene.state.connections;
  const setDirN = useCallback(() => {
    connections.n = !connections.n;
  }, [connections.n]);

  const setDirS = useCallback(() => {
    connections.s = !connections.s;
  }, [connections.s]);

  const setDirE = useCallback(() => {
    connections.e = !connections.e;
  }, [connections.e]);

  const setDirW = useCallback(() => {
    connections.w = !connections.w;
  }, [connections.w]);

  const clearDirections = useCallback(() => {
    let name: Directions;
    for (name in connections) {
      connections[name] = false;
    }
  }, [connections]);

  return (
    <div className="pipes-editor">
      <div className="zone-n" onClick={setDirN}></div>
      <div className="zone-w" onClick={setDirW}></div>
      <div className="zone-center" onClick={clearDirections}>
        <IoIosClose />
      </div>
      <div className="zone-e" onClick={setDirE}></div>
      <div className="zone-s" onClick={setDirS}></div>
    </div>
  );
};
