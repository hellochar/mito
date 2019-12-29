import Mito from "sketches/mito";
import { ArrowHelper, Object3D, Scene, Vector3 } from "three";
import { Transport } from "../../game/tile";
import { InstancedTileRenderer } from "./InstancedTileRenderer";
import TileBatcher from "./tileBatcher";

export class TransportRenderer extends InstancedTileRenderer<Transport> {
  private arrow: Object3D;
  private origin: Vector3;
  constructor(target: Transport, scene: Scene, mito: Mito, batchMesh: TileBatcher) {
    super(target, scene, mito, batchMesh);
    // const length = target.dir.length() - 0.25;
    const length = 0.75;
    const arrowDir = new Vector3(target.dir.x, target.dir.y, 0).normalize();
    const pos = arrowDir.clone().multiplyScalar(-length / 2);
    this.origin = new Vector3(pos.x, pos.y, 2);
    this.arrow = new ArrowHelper(arrowDir, this.origin, length, 0xffffff, 0.1, 0.1);
    this.scene.add(this.arrow);
  }

  update() {
    super.update();
    this.arrow.position.set(
      this.target.pos.x + this.origin.x,
      this.target.pos.y + this.target.droopY + this.origin.y,
      2
    );
  }

  destroy() {
    this.scene.remove(this.arrow);
  }
}
