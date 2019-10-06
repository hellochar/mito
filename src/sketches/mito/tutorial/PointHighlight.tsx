import * as React from "react";
import * as THREE from "three";

import lazy from "../../../common/lazy";
import { SceneObject } from "./sceneObject";

export const POINT_HIGHLIGHT = lazy(() => {
  const geometry = new THREE.CircleBufferGeometry(0.1, 20);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = 10;
  return mesh;
  // const edgesGeometry = new THREE.EdgesGeometry(geometry, 1); // or WireframeGeometry( geometry )
  // const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
  // const lineSegments = new THREE.LineSegments(edgesGeometry, material);
  // lineSegments.position.z = 10;
  // return lineSegments;
});

export interface PointHighlightProps {
  x: number;
  y: number;
  z?: number;
  scene: THREE.Scene;
}

class PointHighlight extends React.PureComponent<PointHighlightProps, {}> {
  private object = POINT_HIGHLIGHT().clone();
  render() {
    this.object.position.x = this.props.x;
    this.object.position.y = this.props.y;
    return (
      <>
        {/* <Animate a={((t) => this.object.scale.setScalar(Math.sin(t * 3.7) * 0.04 + 0.94))} /> */}
        <SceneObject object={this.object} parent={this.props.scene} />
      </>
    );
  }
}

export default PointHighlight;
