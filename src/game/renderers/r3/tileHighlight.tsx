import * as React from "react";
import * as THREE from "three";
import lazy from "../../../common/lazy";
import { Animate } from "./Animate";
import { SceneObject } from "./sceneObject";

export const TILE_HIGHLIGHT = lazy(() => {
  const geometry = new THREE.PlaneBufferGeometry(1, 1);
  const edgesGeometry = new THREE.EdgesGeometry(geometry, 1); // or WireframeGeometry( geometry )
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.75,
  });
  const lineSegments = new THREE.LineSegments(edgesGeometry, material);
  lineSegments.position.z = 10;
  return lineSegments;
});

export interface TileHighlightProps {
  x: number;
  y: number;
  scene: THREE.Scene;
}

export class TileHighlight extends React.PureComponent<TileHighlightProps, {}> {
  private object = TILE_HIGHLIGHT().clone();

  render() {
    this.object.position.x = this.props.x;
    this.object.position.y = this.props.y;
    return (
      <>
        <Animate a={(t) => this.object.scale.setScalar(Math.sin(t * 3.7) * 0.04 + 0.94)} />
        <SceneObject object={this.object} parent={this.props.scene} />
      </>
    );
  }
}
