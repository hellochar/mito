import { MaterialInfo } from "core/cell";
import { Insect } from "core/insect";
import { Locust } from "core/locust";
import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry, Scene, Vector2 } from "three";
import { Constructor } from "typings/constructor";
import { lerp2 } from "../../math";
import { Mito } from "../mito/mito";
import { textureFromSpritesheet } from "../spritesheet";
import { InventoryRenderer } from "./InventoryRenderer";
import { Renderer } from "./Renderer";
import { AnimationController } from "./tile/Animation";

export class InsectRenderer extends Renderer<Insect> {
  public mesh: Mesh;

  protected animation = new AnimationController();

  public inventoryRenderer?: InventoryRenderer;

  constructor(target: Insect, scene: Scene, mito: Mito) {
    super(target, scene, mito);
    this.mesh = newMesh(target);
    this.mesh.name = "Insect Mesh";
    lerp2(this.mesh.position, this.target.pos, 1);
    this.mesh.position.z = 1;
    this.scene.add(this.mesh);

    if (mito.worldRenderer.inventoryPoints) {
      this.inventoryRenderer = new (class extends InventoryRenderer {
        getCarrierPos() {
          return target.posFloat;
        }
      })(this.target.inventory, this.scene, this.mito, mito.worldRenderer.inventoryPoints);
      this.inventoryRenderer.animationOffset = (this.target.pos.x + this.target.pos.y) / 2;
    }
  }

  update() {
    const pos = this.target.posFloat.clone();
    this.mesh.position.set(pos.x, pos.y, 2);
    this.animation.update();
    this.inventoryRenderer?.update();
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.inventoryRenderer?.destroy();
  }
}

function newMesh(insect: Insect) {
  const materialInfo = materialInfoMapping.get(insect.constructor as Constructor<Insect>)!;
  const m = new Mesh(
    new PlaneBufferGeometry(1, 1),
    new MeshBasicMaterial({
      transparent: true,
      map: textureFromSpritesheet(materialInfo.texturePosition.x, materialInfo.texturePosition.y, "transparent"),
      color: new Color("white"),
      side: DoubleSide,
    })
  );
  return m;
}

const materialInfoMapping = (() => {
  const materials = new Map<Constructor<Insect>, MaterialInfo>();
  materials.set(Locust, {
    texturePosition: new Vector2(0, 7),
  });
  return materials;
})();
