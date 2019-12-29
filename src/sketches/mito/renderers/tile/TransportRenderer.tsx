import { easeExpOut } from "d3-ease";
import Mito from "sketches/mito";
import { ArrowHelper, Object3D, Scene, Vector2, Vector3 } from "three";
import { Transport } from "../../game/tile";
import { Animation } from "./Animation";
import { InstancedTileRenderer } from "./InstancedTileRenderer";
import TileBatcher from "./tileBatcher";

export class TransportRenderer extends InstancedTileRenderer<Transport> {
  private arrow: Object3D;
  private origin: Vector2;
  constructor(target: Transport, scene: Scene, mito: Mito, batchMesh: TileBatcher) {
    super(target, scene, mito, batchMesh);
    // const length = target.dir.length() - 0.25;
    const length = 0.75;
    const arrowDir = target.dir.clone().normalize();
    this.origin = arrowDir.clone().multiplyScalar(-length / 2);
    this.arrow = new ArrowHelper(
      new Vector3(arrowDir.x, arrowDir.y, 0),
      new Vector3(this.origin.x, this.origin.y, 2),
      length,
      0xffffff,
      0.1,
      0.1
    );
    this.scene.add(this.arrow);
  }

  update() {
    this.updateArrowPosition();

    if (this.target.didJustTransport) {
      this.animation.set(this.arrowMoveAnimation());
    }

    super.update();
  }

  updateArrowPosition({ x, y }: { x: number; y: number } = this.origin) {
    this.arrow.position.set(this.target.pos.x + x, this.target.pos.y + this.target.droopY + y, 2);
  }

  arrowMoveAnimation(): Animation {
    const duration = 0.25;
    const len = this.origin.length();
    const start = this.origin.clone().setLength(len * 1.1);
    const target = this.origin.clone().setLength(len * 0.5);
    return (t) => {
      const tNorm = t / duration;
      this.updateArrowPosition(start.clone().lerp(target, easeExpOut(tNorm)));
      return tNorm >= 1;
    };
  }

  destroy() {
    this.scene.remove(this.arrow);
  }
}
