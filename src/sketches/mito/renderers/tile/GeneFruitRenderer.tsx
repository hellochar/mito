import { map } from "math";
import React from "react";
import { fruitGetPercentMatured, GeneFruit } from "sketches/mito/game/tile/genes/GeneFruit";
import "./FruitRenderer.scss";
import { GeneRenderer } from "./GeneRenderer";

export class GeneFruitRenderer extends GeneRenderer<GeneFruit> {
  private showElement = false;
  resourcesNeededElement = this.mito.addWorldDOMElement(
    () => this.target.cell,
    () => {
      if (!this.showElement) {
        return null;
      }
      const { state, props } = this.target;
      return (
        <div className="fruit-indicator">
          <div>
            {state.committedResources.water.toFixed(1)}/{props.neededResources / 2} water
          </div>
          <div>
            {state.committedResources.sugar.toFixed(1)}/{props.neededResources / 2} sugar
          </div>
        </div>
      );
    }
  );

  hover() {
    this.showElement = true;
  }

  update() {
    this.showElement = false;
    this.updateScale();
  }

  updateScale() {
    const scale = map(fruitGetPercentMatured(this.target), 0, 1, 0.2, 1);
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
    this.mito.removeWorldDOMElement(this.resourcesNeededElement);
  }
}
