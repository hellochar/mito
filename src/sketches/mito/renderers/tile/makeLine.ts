import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial, Vector3 } from "three";

const lineGeometry = (() => {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3));
  return g;
})();

export default function makeLine(dir: Vector3, origin: Vector3, length: number, color: number) {
  // copied from https://github.com/mrdoob/js/blob/master/src/helpers/ArrowHelper.js
  const line = new Line(lineGeometry, new LineBasicMaterial({ color: color }));
  line.position.copy(origin);
  // dir is assumed to be normalized
  if (dir.y > 0.99999) {
    line.quaternion.set(0, 0, 0, 1);
  } else if (dir.y < -0.99999) {
    line.quaternion.set(1, 0, 0, 0);
  } else {
    const axis = new Vector3(dir.z, 0, -dir.x).normalize();
    const radians = Math.acos(dir.y);
    line.quaternion.setFromAxisAngle(axis, radians);
  }
  line.scale.set(1, Math.max(0, length), 1);
  line.position.z = 0.1;
  line.updateMatrix();
  line.matrixAutoUpdate = false;
  return line;
}
