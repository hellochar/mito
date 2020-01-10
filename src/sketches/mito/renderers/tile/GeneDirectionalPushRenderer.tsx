import { easeExpOut } from "d3-ease";
import { GeneDirectionalPush } from "sketches/mito/game/tile/genes/GeneDirectionalPush";
import { ArrowHelper, Object3D, Vector2, Vector3 } from "three";
import { Animation } from "./Animation";
import { GeneRenderer } from "./GeneRenderer";

export class GeneDirectionalPushRenderer extends GeneRenderer<GeneDirectionalPush> {
  private arrow!: Object3D;
  private origin!: Vector2;

  private lastDir?: Vector2;

  update() {
    this.updateArrow();
    this.updateArrowPosition();

    if (this.target.state.didJustTransport) {
      this.tr.animation.set(this.arrowMoveAnimation());
    }
  }

  updateArrow() {
    if (this.lastDir !== this.target.cell.args!.direction) {
      if (this.arrow != null) {
        this.arrow.parent!.remove(this.arrow);
      }
      // const length = target.dir.length() - 0.25;
      const length = 0.75;
      const arrowDir = this.target.cell.args!.direction!.clone().normalize();
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
      this.lastDir = this.target.cell.args!.direction!;
    }
  }

  updateArrowPosition({ x, y }: { x: number; y: number } = this.origin) {
    this.arrow.position.set(this.target.cell.pos.x + x, this.target.cell.pos.y + this.target.cell.droopY + y, 2);
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

  hover() {}

  destroy() {
    this.scene.remove(this.arrow);
  }
}
