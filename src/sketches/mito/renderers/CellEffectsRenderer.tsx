import { lerp } from "math";
import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry } from "three";
import { Cell, CellEffect, FreezeEffect } from "../game/tile";
import { textureFromSpritesheet } from "../spritesheet";
import { Renderer } from "./Renderer";
import { TileRenderer } from "./TileRenderer";

export class CellEffectsRenderer extends Renderer<Cell> {
  private renderers: Renderer<CellEffect>[] = [];
  constructor(public readonly tileRenderer: TileRenderer<Cell>) {
    super(tileRenderer.target, tileRenderer.scene, tileRenderer.mito);
  }

  update() {
    // account for if target has more effects
    let index;
    for (index = 0; index < this.target.effects.length; index++) {
      const effect = this.target.effects[index];
      const renderer = this.renderers[index];
      if (renderer == null) {
        this.renderers[index] = createEffectRenderer(effect, this.tileRenderer);
      } else if (effect !== renderer.target) {
        // delete and add new renderer
        renderer.destroy();
        this.renderers[index] = createEffectRenderer(effect, this.tileRenderer);
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

function createEffectRenderer<T extends CellEffect>(effect: T, tileRenderer: TileRenderer): Renderer<CellEffect> {
  if (effect instanceof FreezeEffect) {
    return new FreezeEffectRenderer(effect, tileRenderer);
  } else {
    throw new Error("effect renderer not defined for" + effect);
  }
}

class FreezeEffectRenderer extends Renderer<FreezeEffect> {
  static newMesh = () => {
    const g = new PlaneBufferGeometry(1.1, 1.1);
    g.translate(0, 0, 1);
    const material = new MeshBasicMaterial({
      map: textureFromSpritesheet(Math.floor(23 / 16), Math.floor(22 / 16)),
      side: DoubleSide,
      color: TileRenderer.COLD_COLOR.clone(),
      transparent: true,
      opacity: 0.1,
    });
    return new Mesh(g, material);
  };

  private mesh: Mesh;
  constructor(target: FreezeEffect, public tileRenderer: TileRenderer) {
    super(target, tileRenderer.scene, tileRenderer.mito);
    this.mesh = FreezeEffectRenderer.newMesh();
    tileRenderer.mesh.add(this.mesh);
    this.mesh.scale.set(2, 2, 1);
  }

  update() {
    const percentDead = 1 - this.target.turnsUntilDeath / this.target.turnsToDie;
    const material = (this.mesh.material as MeshBasicMaterial);
    material.color.copy(TileRenderer.COLD_COLOR).lerp(new Color(0), percentDead);
    material.opacity = lerp(material.opacity, 0.5, 0.05);
    this.mesh.scale.x = lerp(this.mesh.scale.x, 1, 0.05);
    this.mesh.scale.y = lerp(this.mesh.scale.y, 1, 0.05);
  }

  destroy() {
    this.tileRenderer.mesh.remove(this.mesh);
  }
}
