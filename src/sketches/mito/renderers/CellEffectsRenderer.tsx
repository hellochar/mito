import { lerp, map } from "math";
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
    const g = new PlaneBufferGeometry(0.75, 0.75);
    g.translate(0, 0, 1);
    const material = new MeshBasicMaterial({
      map: textureFromSpritesheet(Math.floor(23 / 16), Math.floor(22 / 16)),
      side: DoubleSide,
      color: COLD_BLUE,
      transparent: true,
      opacity: 0.5,
    });
    return new Mesh(g, material);
  };

  private mesh: Mesh;
  constructor(target: FreezeEffect, public tileRenderer: TileRenderer) {
    super(target, tileRenderer.scene, tileRenderer.mito);
    this.mesh = FreezeEffectRenderer.newMesh();
    tileRenderer.mesh.add(this.mesh);
    this.mesh.scale.set(0.01, 0.01, 1);
  }

  update() {
    const percentFrozen = this.target.percentFrozen;
    const s = map(percentFrozen, 0, 1, 0.2, 1);
    this.mesh.scale.x = lerp(this.mesh.scale.x, s, 0.2);
    this.mesh.scale.y = lerp(this.mesh.scale.y, s, 0.2);
  }

  destroy() {
    this.tileRenderer.mesh.remove(this.mesh);
  }
}

const COLD_BLUE = new Color("#1E90FF").lerp(new Color(0), 0.5);
