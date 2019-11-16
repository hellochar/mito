import { lerp, map } from "math";
import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry, Scene } from "three";
import Mito from "../..";
import { Cell, CellEffect, FreezeEffect } from "../../game/tile";
import { textureFromSpritesheet } from "../../spritesheet";
import { Renderer } from "../Renderer";

export class CellEffectsRenderer extends Renderer<Cell> {
  private renderers: Renderer<CellEffect>[] = [];

  update() {
    // account for if target has more effects
    let index;
    for (index = 0; index < this.target.effects.length; index++) {
      const effect = this.target.effects[index];
      const renderer = this.renderers[index];
      if (renderer == null) {
        this.renderers[index] = createEffectRenderer(effect, this.scene, this.mito);
      } else if (effect !== renderer.target) {
        // delete and add new renderer
        renderer.destroy();
        this.renderers[index] = createEffectRenderer(effect, this.scene, this.mito);
      }
    }
    // delete extraneous effects
    for (; index < this.renderers.length; index++) {
      const renderer = this.renderers[index];
      renderer.destroy();
    }

    for (const r of this.renderers) {
      r.update();
    }
  }

  destroy() {
    for (const r of this.renderers) {
      r.destroy();
    }
  }
}

function createEffectRenderer<T extends CellEffect>(effect: T, scene: Scene, mito: Mito): Renderer<CellEffect> {
  if (effect instanceof FreezeEffect) {
    return new FreezeEffectRenderer(effect, scene, mito);
  } else {
    throw new Error("effect renderer not defined for" + effect);
  }
}

const COLD_BLUE = new Color("#1E90FF").lerp(new Color(0), 0.5);

class FreezeEffectRenderer extends Renderer<FreezeEffect> {
  static newMesh = (() => {
    const g = new PlaneBufferGeometry(0.75, 0.75);
    const material = new MeshBasicMaterial({
      map: textureFromSpritesheet(Math.floor(23 / 16), Math.floor(22 / 16)),
      side: DoubleSide,
      color: COLD_BLUE,
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new Mesh(g, material);
    return () => mesh.clone();
  })();

  private mesh: Mesh;
  constructor(target: FreezeEffect, scene: Scene, mito: Mito) {
    super(target, scene, mito);
    this.mesh = FreezeEffectRenderer.newMesh();
    scene.add(this.mesh);
    this.mesh.scale.set(0.01, 0.01, 1);
  }

  update() {
    const percentFrozen = this.target.percentFrozen;
    const s = map(percentFrozen, 0, 1, 0.2, 1);
    this.mesh.scale.x = lerp(this.mesh.scale.x, s, 0.2);
    this.mesh.scale.y = lerp(this.mesh.scale.y, s, 0.2);
    const cell = this.target.cell;
    const pos = cell.pos;
    this.mesh.position.set(pos.x, pos.y + cell.droopY, 2);
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
