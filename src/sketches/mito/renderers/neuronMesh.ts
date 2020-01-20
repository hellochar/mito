import { lerp, lerp2 } from "math";
import { arrayRange } from "math/arrays";
import {
  CircleBufferGeometry,
  DoubleSide,
  Geometry,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector2,
} from "three";

export const playerBrown = 0x8f673f;
export const playerTeal = 0x5eb780;

const baseMesh = (() => {
  const geometry = new CircleBufferGeometry(0.07, 20);
  const material = new MeshBasicMaterial({
    color: playerTeal,
    // color: ,
    side: DoubleSide,
  });
  const mesh = new Mesh(geometry, material);
  return mesh;
})();

class Node {
  constructor(public pos: Vector2, public vel: Vector2 = new Vector2(0, 0), public scale = 1) {}
}
/**
 * For now: A thick line that branches out into 3 nodes.
 *
 * Should have a physics-y feel to it (maybe bones?)
 * Be UV-able
 */
class NeuronMesh extends Object3D {
  // const geom = new LineGeometry();
  // geom.setPositions([0, 0, 0, 1, 0, 0]);
  // geom.setColors([1, 1, 1, 1, 0, 0]);
  // const mat = new LineMaterial({
  //   color: 0xffffff,
  //   linewidth: 5,
  //   vertexColors: VertexColors,
  //   dashed: false,
  // });
  // mat.resolution.set(window.innerWidth, window.innerHeight);

  // const line = new Line2(geom, mat);
  // line.computeLineDistances();
  // line.scale.set(1, 1, 1);
  // return line;

  public nodes: Node[] = [];
  public meshes: Mesh[] = [];
  public line: Line;

  constructor(numNodes: number) {
    super();
    this.nodes = arrayRange(numNodes).map((i) => {
      return new Node(new Vector2(i / numNodes, 0));
    });
    this.meshes = this.nodes.map((n) => {
      const m = baseMesh.clone();
      m.position.set(n.pos.x, n.pos.y, m.position.z);
      return m;
    });
    this.add(...this.meshes);
    const lineGeo = new Geometry();
    lineGeo.vertices.push(...this.meshes.map((m) => m.position));
    this.line = new Line(
      lineGeo,
      new LineBasicMaterial({
        color: playerTeal,
      })
    );
    this.add(this.line);
    // const r1 = new Mesh(
    //   new PlaneBufferGeometry(0.7, 0.1).translate(0.35, 0, 0),
    //   new MeshBasicMaterial({ side: DoubleSide, color: 0x8f673f })
    // );
    // const branchLeft = new Mesh(
    //   new PlaneBufferGeometry(0.3, 0.05).translate(0.15, 0, 0),
    //   new MeshBasicMaterial({ side: DoubleSide, color: 0x5eb780 })
    // );
    // branchLeft.position.set(0.35, 0, 0);
    // const branchCenter = branchLeft.clone();
    // const branchRight = branchLeft.clone();
    // branchLeft.rotation.z = -Math.PI / 3;
    // branchRight.rotation.z = Math.PI / 3;

    // r1.add(branchLeft, branchCenter, branchRight);
    // this.add(r1);

    // const gui = new GUI();
    // gui.add(this, "pullForceScalar", 0, 100);
    // gui.add(this, "towardsTargetForce", 0, 100);
    // gui.add(this, "dragForceScalar", -100, -0);
  }

  public handleInteracted() {
    const last = this.nodes[this.nodes.length - 1];
    last.scale = 2.1;
  }

  private pullForceScalar = 10;
  private towardsTargetForce = 5;
  private dragForceScalar = -3;

  update(dt: number, target: Vector2) {
    // node 0 is always tied to 0, 0
    // node n is tied directly at target
    // intermediate nodes move towards their targets
    // const first = this.nodes[0];
    const last = this.nodes[this.nodes.length - 1];
    lerp2(last.pos, target, 0.5);
    let force = new Vector2();
    for (let i = 1; i < this.nodes.length - 1; i++) {
      force.set(0, 0);

      const node = this.nodes[i];
      const prev = this.nodes[i - 1];
      const next = this.nodes[i + 1];

      // prev force
      force.add(this.pullForce(node, prev, this.pullForceScalar));
      force.add(this.pullForce(node, next, this.pullForceScalar));
      force.add(this.goTowardsTargetForce(node, target, i / (this.nodes.length - 1), this.towardsTargetForce));
      force.add(this.dragForce(node, this.dragForceScalar));

      node.scale = lerp(node.scale, next.scale, 0.5);

      node.vel.add(force.multiplyScalar(dt));
    }

    this.nodes.forEach((node, i) => {
      node.pos.x += node.vel.x * dt;
      node.pos.y += node.vel.y * dt;
      const mesh = this.meshes[i];
      mesh.position.set(node.pos.x, node.pos.y, mesh.position.z);
      mesh.scale.set(node.scale, node.scale, 1);
    });
    last.scale = lerp(last.scale, 1, 0.5);
    (this.line.geometry as Geometry).verticesNeedUpdate = true;
  }

  goTowardsTargetForce = (() => {
    const offset = new Vector2();
    return (node: Node, target: Vector2, percent: number, pow: number) => {
      offset
        .copy(target)
        .multiplyScalar(percent)
        .sub(node.pos);
      return offset.multiplyScalar(pow);
    };
  })();

  dragForce = (() => {
    const drag = new Vector2();
    return (node: Node, pow: number) => {
      drag.copy(node.vel).multiplyScalar(pow);
      return drag;
    };
  })();

  private pullForce = (() => {
    const offset = new Vector2();
    return (node: Node, other: Node, pow: number) => {
      offset.copy(node.pos).sub(other.pos);
      return offset.multiplyScalar(-pow);
    };
  })();
}

export default NeuronMesh;
