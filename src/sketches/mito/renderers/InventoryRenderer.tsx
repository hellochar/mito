import { Color, Scene, Vector2 } from "three";
import lazy from "../../../common/lazy";
import { map } from "../../../math";
import { Mito } from "../index";
import { Inventory } from "../inventory";
import { textureFromSpritesheet } from "../spritesheet";
import { Renderer } from "./Renderer";
import { ResourceParticles } from "./resourceParticles";


// we represent Resources as dots of certain colors.
export class InventoryRenderer extends Renderer<Inventory> {
  static WaterParticles = lazy(
    () =>
      new ResourceParticles(
        {
          color: new Color("rgb(9, 12, 255)"),
          size: 45,
          opacity: 0.75,
        }
        // new PointsMaterial({
        //     // map: textureFromSpritesheet(0, 1),
        //     transparent: true,
        //     opacity: 0.75,
        //     // color: new Color("rgb(12, 41, 255)"),
        //     // color: new Color("rgb(29, 42, 255)"),
        //     color: new Color("rgb(9, 12, 255)"),
        //     size: .12,
        //     side: DoubleSide,
        // })
      )
  );

  static SugarParticles = lazy(
    () =>
      new ResourceParticles(
        {
          color: new Color("yellow"),
          size: 85,
          opacity: 0.9,
          map: textureFromSpritesheet(42, 12, "transparent"),
        }
        // new PointsMaterial({
        //     map: textureFromSpritesheet(42, 12, "transparent"),
        //     transparent: true,
        //     opacity: 0.9,
        //     color: "yellow",
        //     size: .12,
        //     side: DoubleSide,
        // })
      )
  );

  static startFrame() {
    InventoryRenderer.WaterParticles().startFrame();
    InventoryRenderer.SugarParticles().startFrame();
  }

  static endFrame() {
    InventoryRenderer.WaterParticles().endFrame();
    InventoryRenderer.SugarParticles().endFrame();
  }
  // static geometry = new PlaneBufferGeometry(1, 1);
  // static waterMaterial = new MeshBasicMaterial({
  //     // map: textureFromSpritesheet(0, 1),
  //     transparent: true,
  //     opacity: 0.75,
  //     // color: new Color("rgb(12, 41, 255)"),
  //     // color: new Color("rgb(29, 42, 255)"),
  //     color: new Color("rgb(9, 12, 255)"),
  //     side: DoubleSide,
  // });
  // static sugarMaterial = lazy(() => new MeshBasicMaterial({
  //     map: textureFromSpritesheet(42, 12, "transparent"),
  //     transparent: true,
  //     opacity: 0.9,
  //     color: "yellow",
  //     // color: new Color("yellow"),
  //     side: DoubleSide,
  // }));
  public animationOffset = 0;
  // public object = new Object3D();
  public waters: Vector2[] = [];
  public sugars: Vector2[] = [];
  constructor(target: Inventory, scene: Scene, mito: Mito) {
    super(target, scene, mito);
    target.on("get", this.handleGetResources);
    target.on("give", this.handleGiveResources);
    // this.object.name = "InventoryRenderer Object";
    // this.object.position.z = 1;
    // this.object.updateMatrix();
    // this.object.matrixAutoUpdate = false;
    for (let i = 0; i < this.target.water; i++) {
      this.waters.push(newParticle());
    }
    for (let i = 0; i < this.target.sugar; i++) {
      this.sugars.push(newParticle());
    }
  }
  private handleGetResources = (giver: Inventory) => {
    let wantedMeshes = Math.ceil(this.target.water);
    while (this.waters.length < wantedMeshes) {
      const v = giver.carrier.pos.clone().sub(this.target.carrier.pos);
      v.x += (Math.random() - 0.5) * 0.1;
      v.y += (Math.random() - 0.5) * 0.1;
      this.waters.push(v);
    }

    wantedMeshes = Math.ceil(this.target.sugar);
    while (this.sugars.length < wantedMeshes) {
      const v = giver.carrier.pos.clone().sub(this.target.carrier.pos);
      v.x += (Math.random() - 0.5) * 0.1;
      v.y += (Math.random() - 0.5) * 0.1;
      this.sugars.push(v);
    }
  };

  private handleGiveResources = () => {
    let wantedMeshes = Math.ceil(this.target.water);
    if (this.waters.length > wantedMeshes) {
      this.waters.splice(wantedMeshes, this.waters.length - wantedMeshes);
    }

    wantedMeshes = Math.ceil(this.target.sugar);
    if (this.sugars.length > wantedMeshes) {
      this.sugars.splice(wantedMeshes, this.sugars.length - wantedMeshes);
    }
  };

  private updateNumParticles(resources: number) {
    // while (resourceArray.length < wantedMeshes) {
    //     this.newParticle(resourceArray);
    // }
    // if (resourceArray.length > wantedMeshes) {
    //     resourceArray.splice(wantedMeshes, resourceArray.length - wantedMeshes);
    // }
  }

  private commitParticles(particles: ResourceParticles, resource: number, resourceArray: Vector2[]) {
    if (resourceArray.length > 0) {
      for (let i = 0; i < resourceArray.length - 1; i++) {
        const p = resourceArray[i];
        particles.commit(p.x + this.target.carrier.pos.x, p.y + this.target.carrier.pos.y, 10, 1);
        resource -= 1;
      }
      const p = resourceArray[resourceArray.length - 1];
      const fract = resource;
      particles.commit(
        p.x + this.target.carrier.pos.x,
        p.y + this.target.carrier.pos.y,
        10,
        map(Math.sqrt(fract), 0, 1, 0.2, 1)
      );
    }
  }

  private simulateResourcePositions() {
    const numWaters = this.waters.length;
    const numResources = numWaters + this.sugars.length;
    for (let i = 0; i < numResources; i++) {
      const r = i < numWaters ? this.waters[i] : this.sugars[i - numWaters];
      let vx = 0,
        vy = 0;
      const angle = performance.now() / 3000 + this.animationOffset;
      vx += Math.cos(angle) * 0.02;
      // vel.y += Math.sin(performance.now() / 3000) * 0.1;
      const goTowardsCenterStrength = 0.1 + r.length() * 0.1;
      vx += -r.x * goTowardsCenterStrength;
      vy += -r.y * goTowardsCenterStrength;
      const player = this.mito.world.player;
      if (player.pos.equals(this.target.carrier.pos)) {
        const playerX = player.posFloat.x - player.pos.x;
        const playerY = player.posFloat.y - player.pos.y;
        const offsetX = r.x - playerX;
        const offsetY = r.y - playerY;
        const mag2 = offsetX * offsetX + offsetY * offsetY;
        const avoidPlayerStrength = Math.max(Math.min(map(mag2, 0, 1, 3, -5), 3), 0);
        const accelerationX = offsetX * avoidPlayerStrength * 0.2;
        const accelerationY = offsetY * avoidPlayerStrength * 0.2;
        vx += accelerationX;
        vy += accelerationY;
      }
      for (let j = 0; j < numResources; j++) {
        const l = j < numWaters ? this.waters[j] : this.sugars[j - numWaters];
        if (r === l) {
          break;
        }
        const dx = r.x - l.x;
        const dy = r.y - l.y;
        const lengthSq = dx * dx + dy * dy;
        if (lengthSq > 0) {
          const strength = 0.003 / lengthSq;
          vx += dx * strength;
          vy += dy * strength;
        }
      }
      r.x += vx;
      r.y += vy;
    }
  }

  update() {
    this.updateNumParticles(this.target.water);
    this.updateNumParticles(this.target.sugar);
    this.simulateResourcePositions();
    this.commitParticles(InventoryRenderer.WaterParticles(), this.target.water, this.waters);
    this.commitParticles(InventoryRenderer.SugarParticles(), this.target.sugar, this.sugars);
  }

  destroy() {
    // no-op
    this.target.off("get", this.handleGetResources);
    this.target.off("give", this.handleGiveResources);
  }
}

function newParticle() {
  return new Vector2((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01);
}
