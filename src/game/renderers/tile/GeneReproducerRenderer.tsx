import { nf } from "common/formatters";
import { Gene } from "core/cell/gene";
import { map } from "math";
import React from "react";
import { reproducerGetPercentMatured, ReproducerState } from "std/genes/GeneReproducer";
import { GeneRenderer } from "./GeneRenderer";
import "./GeneReproducerRenderer.scss";

export class GeneReproducerRenderer extends GeneRenderer<Gene<ReproducerState, any>> {
  percentMatureElement = this.mito.addWorldDOMElement(
    () => this.target.cell,
    () => {
      const matured = reproducerGetPercentMatured(this.target);
      return <div className="reproducer-percent-mature">{nf(matured * 100, 2)}%</div>;
    }
  );

  hover() {}

  update() {
    this.updateScale();
  }

  updateScale() {
    const scale = map(reproducerGetPercentMatured(this.target), 0, 1, 0.2, 1);
    this.tr.scale.set(scale, scale, 1);
  }

  //   super.update();
  // if (this.target.age - this.lastEmitAge > 0.5) {
  //   const angle = Math.random() * Math.PI * 2;
  //   const speed = 0.1;
  //   const dx = Math.cos(angle) * speed;
  //   const dy = Math.sin(angle) * speed;
  //   fruitSparkle.fire({
  //     x: this.target.pos.x,
  //     y: this.target.pos.y,
  //     z: 1,
  //     alpha: 1,
  //     info: { dx, dy },
  //     size: 1,
  //     time: 0,
  //     // r: angle,
  //   });
  //   this.lastEmitAge = this.target.age;
  // }
  // }

  destroy() {
    this.mito.removeWorldDOMElement(this.percentMatureElement);
  }
}
