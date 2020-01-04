import React from "react";
import Mito from "sketches/mito";
import { WorldDOMElement } from "sketches/mito/WorldDOMElement";
import { Scene } from "three";
import { Fruit } from "../../game/tile";
import "./FruitRenderer.scss";
import { InstancedTileRenderer } from "./InstancedTileRenderer";
import TileBatcher from "./tileBatcher";

export class FruitRenderer extends InstancedTileRenderer<Fruit> {
  lastEmitAge: number = -Infinity;
  resourcesNeededElement: WorldDOMElement;
  constructor(fruit: Fruit, scene: Scene, mito: Mito, batchMesh: TileBatcher) {
    super(fruit, scene, mito, batchMesh);
    this.resourcesNeededElement = mito.addWorldDOMElement(
      () => this.target,
      () => {
        return (
          <div className="fruit-indicator">
            <div>
              {fruit.committedResources.water.toFixed(1)}/{fruit.neededResources / 2} water
            </div>
            <div>
              {fruit.committedResources.sugar.toFixed(1)}/{fruit.neededResources / 2} sugar
            </div>
          </div>
        );
      }
    );
  }

  update() {
    super.update();
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
  }

  destroy() {
    this.mito.removeWorldDOMElement(this.resourcesNeededElement);
    super.destroy();
  }
}
