import * as React from "react";
import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry } from "three";
import { CellType } from "../../../core/cell/genome";
import { textureFromSpritesheet } from "../spritesheet";
import { SceneObject } from "./sceneObject";

export const BUILD_BLUEPRINT = (() => {
  const geometry = new PlaneBufferGeometry(1, 1);
  const material = new MeshBasicMaterial({
    side: DoubleSide,
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = "Build Blueprint";
  mesh.position.z = 1;
  return mesh;
})();

export interface TileHighlightProps {
  x: number;
  y: number;
  cellType: CellType;
  scene: THREE.Scene;
}

const BuildBlueprint: React.FC<TileHighlightProps> = ({ x, y, cellType, scene }) => {
  const object = React.useMemo(() => BUILD_BLUEPRINT.clone(), []);

  React.useEffect(() => {
    object.position.x = x;
    object.position.y = y;
  }, [object.position.x, object.position.y, x, y]);

  React.useEffect(() => {
    const { material } = cellType;
    const { color, texturePosition } = material;
    const texture = textureFromSpritesheet(texturePosition.x, texturePosition.y);
    const mat = object.material as MeshBasicMaterial;
    mat.map = texture;
    mat.color.set(color || new Color(1, 1, 1));
    mat.needsUpdate = true;
  }, [cellType, object.material]);

  return (
    <>
      {/* <Animate a={(t) => object.scale.setScalar(Math.sin(t * 3.7) * 0.04 + 0.94)} /> */}
      <SceneObject object={object} parent={scene} />
    </>
  );
};

export default BuildBlueprint;
