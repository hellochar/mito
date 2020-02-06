import { easeQuadOut } from "d3-ease";
import Ticker from "global/ticker";
import { polyUpDown } from "math/easing";
import { DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry, Scene } from "three";
import { lerp, lerp2, map } from "../../../math";
import { PlayerSeed } from "../game";
import { MaterialInfo } from "../game/materialInfo";
import { Mito } from "../index";
import { textureFromSpritesheet } from "../spritesheet";
import { Renderer } from "./Renderer";
import { Animation, AnimationController, chain } from "./tile/Animation";

export class PlayerSeedRenderer extends Renderer<PlayerSeed> {
  public mesh: Mesh;
  protected animation = new AnimationController();
  constructor(target: PlayerSeed, scene: Scene, mito: Mito) {
    super(target, scene, mito);
    const reproducerCellType = target.world.genome.cellTypes.find(
      (cellType) => cellType.chromosome.mergeStaticProperties().isReproductive
    )!;
    const material = reproducerCellType.material;
    this.mesh = newMesh(material);
    this.mesh.name = "Player Seed Mesh";
    lerp2(this.mesh.position, this.target.pos, 1);
    this.scene.add(this.mesh);
    this.animation.set(this.wiggleAnimationForever());
  }

  update() {
    const pos = this.target.posFloat.clone();
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.position.set(pos.x, pos.y, 11);
    this.animation.update();
  }

  destroy() {
    this.animation.set(
      chain(this.popOutAnimation(), () => {
        this.scene.remove(this.mesh);
        return true;
      })
    );
    Ticker.addAnimation((t) => {
      this.animation.update();
      if (this.animation.animation == null) {
        return true;
      }
    });
  }

  public popOutAnimation(): Animation {
    const growBigDuration = 0.5;
    const finalScale = 6.5;
    const growBig: Animation = (t) => {
      const tNorm = t / growBigDuration;
      this.mesh.scale.setScalar(lerp(1, finalScale, easeQuadOut(tNorm)));
      // (this.mesh.material as MeshBasicMaterial).opacity = lerp(1, 0.5, tNorm);
      return tNorm > 1;
    };
    const stayBig: Animation = (t) => {
      this.mesh.scale.setScalar(finalScale);
      return t > 1;
    };
    const fadeOut: Animation = (t) => {
      const tNorm = t / 0.5;
      (this.mesh.material as MeshBasicMaterial).opacity = lerp(1, 0, tNorm);
      return tNorm > 1;
    };
    return chain(growBig, stayBig, fadeOut);
  }

  public wiggleAnimationForever(): Animation {
    const wiggleDuration = 1;
    const waitDuration = 2;
    return (t) => {
      const tBounded = t % (wiggleDuration + waitDuration);
      if (tBounded < wiggleDuration) {
        const tNorm = tBounded / wiggleDuration;
        const zRot = Math.sin(map(Math.sin(tNorm * Math.PI * 4), -1, 1, -Math.PI / 6, Math.PI / 6)) * polyUpDown(tNorm);
        // this.mesh.rotation.set(0, 0, zRot);
        this.mesh.position.y -= Math.abs(zRot * 1);
      }
      return false;
    };
  }
}

function newMesh(material: MaterialInfo) {
  const m = new Mesh(
    new PlaneBufferGeometry(1, 1),
    new MeshBasicMaterial({
      transparent: true,
      // depthWrite: false,
      // depthTest: false,
      map: textureFromSpritesheet(material.texturePosition.x, material.texturePosition.y),
      color: material.color,
      side: DoubleSide,
    })
  );
  m.renderOrder = 9;
  return m;
}
