import classNames from "classnames";
import configure from "common/configure";
import { CellType, GeneInstance } from "core/cell";
import { Directions, DIRECTIONS } from "core/directions";
import { clickGeneric, playSmallRand } from "game/audio";
import Keyboard from "game/input/keyboard";
import { WorldDOMElement } from "game/mito/WorldDOMElement";
import React, { useCallback } from "react";
import { IoIosClose } from "react-icons/io";
import { GenePipes, updatePipeConnections } from "std/genes/GenePipes";
import { BoxBufferGeometry, Color, DoubleSide, Mesh, MeshBasicMaterial } from "three";
import "./GenePipesRenderer.scss";
import { GeneRenderer } from "./GeneRenderer";

const PIPE_DIR_GEOMETRY = new BoxBufferGeometry(0.4, 0.2);
const PIPE_CENTER_GEOMETRY = new BoxBufferGeometry(0.2, 0.2);
const WHITE = new Color(1, 1, 1);

const materialMap = new Map<CellType, MeshBasicMaterial>();
function getPipeMaterial(cellType: CellType) {
  if (!materialMap.has(cellType)) {
    const color = new Color(cellType.material.color?.getHex() ?? 0xffffff);
    color.lerp(WHITE, 0.5);
    materialMap.set(
      cellType,
      new MeshBasicMaterial({
        color,
        side: DoubleSide,
        opacity: 0.8,
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

    const isEnabled = this.target.state.isEnabled;
    if (isEnabled && this.zeroMesh.parent == null) {
      this.scene.add(this.zeroMesh);
    } else if (!isEnabled && this.zeroMesh.parent != null) {
      this.scene.remove(this.zeroMesh);
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

function setIsEnabled(gene: GeneInstance<GenePipes>, newIsEnabled: boolean) {
  if (gene.state.isEnabled !== newIsEnabled) {
    playSmallRand(clickGeneric);
  }
  gene.state.isEnabled = newIsEnabled;
  updatePipeConnections(gene);
  lastEventStateType = newIsEnabled;
}

let lastEventStateType: true | false | undefined;

const PipesEditor: React.FC<{ gene: GeneInstance<GenePipes> }> = ({ gene }) => {
  let newIsEnabled = !gene.state.isEnabled;
  const toggleAllDirections = useCallback(() => {
    setIsEnabled(gene, newIsEnabled);
  }, [gene, newIsEnabled]);
  const mouseMoveAllDirections = useCallback(
    (event) => {
      if (event.buttons > 0 && lastEventStateType !== undefined) {
        setIsEnabled(gene, lastEventStateType);
      }
    },
    [gene]
  );

  // useEffect(() => {
  //   if (lastEventStateType !== undefined) {
  //     setIsEnabled(gene, lastEventStateType);
  //   }
  // }, [gene]);

  return (
    <div
      className={classNames("pipes-editor", { "turn-on": !newIsEnabled })}
      onMouseDown={toggleAllDirections}
      // onMouseMove={mouseMoveAllDirections}
      onMouseEnter={mouseMoveAllDirections}
    >
      <IoIosClose />
    </div>
  );
};
