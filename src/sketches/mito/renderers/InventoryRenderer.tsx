import Ticker from "global/ticker";
import { Color, Scene, Vector2 } from "three";
import lazy from "../../../common/lazy";
import { map } from "../../../math";
import { Mito } from "../index";
import { Inventory } from "../inventory";
import { textureFromSpritesheet } from "../spritesheet";
import { Renderer } from "./Renderer";
import { ResourcePoints } from "./resourcePoints";

// we represent Resources as dots of certain colors.
export class InventoryRenderer extends Renderer<Inventory> {
  static WaterParticles = lazy(
    () =>
      new ResourcePoints({
        color: new Color("rgb(9, 12, 255)"),
        size: 45,
        opacity: 0.75,
      })
  );

  static SugarParticles = lazy(
    () =>
      new ResourcePoints({
        color: new Color("yellow"),
        size: 85,
        opacity: 0.9,
        map: textureFromSpritesheet(2, 2, "transparent"),
      })
  );

  static startFrame() {
    InventoryRenderer.WaterParticles().startFrame();
    InventoryRenderer.SugarParticles().startFrame();
  }

  static endFrame() {
    InventoryRenderer.WaterParticles().endFrame();
    InventoryRenderer.SugarParticles().endFrame();
  }

  public animationOffset = 0;
  public waters: Vector2[] = [];
  public sugars: Vector2[] = [];

  constructor(target: Inventory, scene: Scene, mito: Mito) {
    super(target, scene, mito);
    target.on("get", this.handleGetResources);
    target.on("give", this.handleGiveResources);
    target.on("add", this.handleAddResources);

    this.updateSugarAndWaterParticles();
  }

  private handleGetResources = (giver: Inventory) => {
    this.updateSugarAndWaterParticles(giver);
  };

  private verifyArrayLengths() {
    if (this.waters.length !== Math.ceil(this.target.water)) {
      throw new Error(
        "water array lengths mismatch: " + this.waters.length + " should be " + Math.ceil(this.target.water)
      );
    }
    if (this.sugars.length !== Math.ceil(this.target.sugar)) {
      throw new Error(
        "sugar array lengths mismatch: " + this.sugars.length + " should be " + Math.ceil(this.target.sugar)
      );
    }
  }

  private handleGiveResources = () => {
    this.updateSugarAndWaterParticles();
  };

  private handleAddResources = (water: number, sugar: number) => {
    this.updateSugarAndWaterParticles();
  };

  private updateSugarAndWaterParticles(giver?: Inventory) {
    this.updateParticlesArray(this.waters, this.target.water, giver);
    this.updateParticlesArray(this.sugars, this.target.sugar, giver);
    this.verifyArrayLengths();
  }

  private updateParticlesArray(particles: Vector2[], resource: number, giver?: Inventory) {
    const wantedParticles = Math.ceil(resource);
    while (particles.length < wantedParticles) {
      const v = giver != null ? giver.carrier.pos.clone().sub(this.target.carrier.pos) : newParticle();
      v.x += (Math.random() - 0.5) * 0.1;
      v.y += (Math.random() - 0.5) * 0.1;
      particles.push(v);
    }
    if (particles.length > wantedParticles) {
      // delete from the start
      particles.splice(0, particles.length - wantedParticles);
    }
    if (particles.length !== wantedParticles) {
      throw new Error("array lengths mismatch: " + particles.length + " should be " + wantedParticles);
    }
    return particles;
  }

  private commitParticles(particles: ResourcePoints, resource: number, resourceArray: Vector2[]) {
    // this.verifyArrayLengths();
    const numFullSizedParticles = Math.floor(resource);
    for (let i = 0; i < numFullSizedParticles; i++) {
      const p = resourceArray[i];
      particles.commit(p.x + this.target.carrier.pos.x, p.y + this.target.carrier.pos.y, 10, 1);
    }
    const fract = resource - numFullSizedParticles;
    if (fract > 0) {
      const p = resourceArray[resourceArray.length - 1];
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
      const angle = Ticker.now / 3000 + this.animationOffset;
      vx += Math.cos(angle) * 0.02;
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
    this.simulateResourcePositions();
    this.commitParticles(InventoryRenderer.WaterParticles(), this.target.water, this.waters);
    this.commitParticles(InventoryRenderer.SugarParticles(), this.target.sugar, this.sugars);
  }

  destroy() {
    this.target.off("get", this.handleGetResources);
    this.target.off("give", this.handleGiveResources);
    this.target.off("add", this.handleAddResources);
  }
}

function newParticle() {
  return new Vector2((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01);
}
