import { easeCubicOut, easeExpOut } from "d3-ease";
import { randFloat, roundToNearest } from "math";
import { GeneDirectionalPush } from "std/genes/GeneDirectionalPush";
import { ArrowHelper, Vector2, Vector3 } from "three";
import { Animation } from "./Animation";
import { GeneRenderer } from "./GeneRenderer";

export class GeneDirectionalPushRenderer extends GeneRenderer<GeneDirectionalPush> {
  private arrow!: ArrowHelper;

  private origin!: Vector2;

  private lastDir = new Vector2(0, 0);

  update() {
    this.updateArrow();
    this.updateArrowPosition();

    if (this.target.state.didJustTransport) {
      this.tileRenderer.animation.set(this.arrowMoveAnimation());
    }
  }

  updateArrow() {
    const dir = this.target.cell.args!.direction!;
    if (!dir.equals(this.lastDir)) {
      if (this.arrow != null) {
        this.arrow.parent!.remove(this.arrow);
      }
      // const length = target.dir.length() - 0.25;
      const length = 0.75;
      const arrowDir = dir.clone().normalize();
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
      this.lastDir.copy(dir);
      this.tileRenderer.animation.set(this.arrowSetAnimation());
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

  arrowSetAnimation(): Animation {
    const duration = 0.2;
    return (t) => {
      const tNorm = t / duration;
      const vibrationAmount = easeCubicOut(1 - tNorm) * 0.1;
      this.updateArrowPosition({
        x: randFloat(-vibrationAmount, vibrationAmount),
        y: randFloat(-vibrationAmount, vibrationAmount),
      });
      // const scale = clamp(map(tNorm, 0, 1, 2, 1), 1, 2);
      // this.arrow.scale.set(scale, scale, 1);
      return tNorm >= 1;
    };
  }

  hover() {}

  destroy() {
    this.scene.remove(this.arrow);
  }
}
