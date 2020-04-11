import { easeBounceOut, easeQuadOut } from "d3-ease";
import { polyUpDown } from "math/easing";
import Ticker from "std/ticker";
import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry, Scene } from "three";
import { PlayerSeed } from "../../core";
import { MaterialInfo } from "../../core/cell/materialInfo";
import { lerp, map } from "../../math";
import { fruitPoof, introBounce } from "../audio";
import { Mito } from "../mito/mito";
import { textureFromSpritesheet } from "../spritesheet";
import { Renderer } from "./Renderer";
import { also, Animation, AnimationController, animPause, chain } from "./tile/Animation";

export class PlayerSeedRenderer extends Renderer<PlayerSeed> {
  public mesh: Mesh;

  protected animation = new AnimationController();

  constructor(target: PlayerSeed, scene: Scene, mito: Mito) {
    super(target, scene, mito);
    const reproducerCellType = target.world.genome.cellTypes.find(
      (cellType) => cellType.chromosome.computeStaticProperties().isReproductive
    )!;
    const material = reproducerCellType.material;
    this.mesh = newMesh(material);
    this.mesh.name = "Player Seed Mesh";
    this.mito.scenePlayerSeed.add(this.mesh);
    this.animation.set(chain(this.fallInAnimation(), animPause(2), this.wiggleAnimationForever()));
    // this.animation.set(this.wiggleAnimationForever());
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
    return chain(
      also(growBig, () => {
        fruitPoof.play();
        return true;
      }),
      stayBig,
      fadeOut
    );
  }

  public fallInAnimation(): Animation {
    const startY = 12;
    const startPosition: Animation = (t) => {
      this.mesh.position.y -= startY;
      return false;
    };
    const duration = 2;
    const anim: Animation = (t) => {
      const tNorm = t / duration;
      this.mesh.position.y -= lerp(startY, 0, easeBounceOut(tNorm));
      return tNorm > 1;
    };
    return chain(
      also(animPause(1), startPosition),
      also(anim, () => {
        introBounce.play();
        return true;
      })
    );
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
      color: material.color ?? new Color("white"),
      side: DoubleSide,
    })
  );
  m.renderOrder = 9;
  return m;
}
