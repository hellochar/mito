import { CancerEffect } from "core/cell/cellEffect";
import { lerp } from "math";
import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry, RingBufferGeometry, Scene } from "three";
import { Cell, CellEffect, FreezeEffect } from "../../../core/tile";
import Mito from "../../../sketches/mito";
import { textureFromSpritesheet } from "../../../sketches/mito/spritesheet";
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
  } else if (effect instanceof CancerEffect) {
    return new CancerEffectRenderer(effect, scene, mito);
  } else {
    throw new Error("effect renderer not defined for" + effect);
  }
}

// export const FREEZE_BLUE = new Color("#1E90FF").lerp(new Color(0), 0.5);
export const FREEZE_BLUE = new Color("lightblue");

class FreezeEffectRenderer extends Renderer<FreezeEffect> {
  static newMesh = (() => {
    const g = new PlaneBufferGeometry(1, 1);
    const material = new MeshBasicMaterial({
      map: textureFromSpritesheet(1, 2),
      side: DoubleSide,
      color: FREEZE_BLUE,
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
    const s = percentFrozen ** 0.5;
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

class CancerEffectRenderer extends Renderer<CancerEffect> {
  static newMesh = (() => {
    // const g = new PlaneBufferGeometry(1, 1);
    const g = new RingBufferGeometry(0.4, 0.5, 20, 20);
    const material = new MeshBasicMaterial({
      map: textureFromSpritesheet(0, 1),
      side: DoubleSide,
      color: new Color("purple"),
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new Mesh(g, material);
    return () => mesh.clone();
  })();

  private mesh: Mesh;

  constructor(target: CancerEffect, scene: Scene, mito: Mito) {
    super(target, scene, mito);
    this.mesh = CancerEffectRenderer.newMesh();
    scene.add(this.mesh);
    this.mesh.scale.set(0.01, 0.01, 1);
  }

  update() {
    const { timeToDuplicate, secondsPerDuplication } = this.target;
    const s = (1 - timeToDuplicate / secondsPerDuplication) ** 0.5;
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
