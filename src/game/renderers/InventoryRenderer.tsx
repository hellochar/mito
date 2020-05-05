import configure from "common/configure";
import Ticker from "std/ticker";
import { Color, Scene, Vector2 } from "three";
import { Inventory } from "../../core/inventory";
import { map } from "../../math";
import { Mito } from "../mito/mito";
import { textureFromSpritesheet } from "../spritesheet";
import { CommittablePoints, CommittablePointsParameters } from "./committablePoints";
import { Renderer } from "./Renderer";

// default
const graphics = {
  particlesPerWater: 1,
  particleSize: 45,
  particleRepelStrength: 0.003,
};

// woooow
// const graphics = {
//   particlesPerWater: 10,
//   particleSize: 25,
//   particleRepelStrength: 0.0005,
// };

export const WATER_POINTS_PARAMS: CommittablePointsParameters = {
  color: new Color("rgb(9, 12, 255)"),
  size: graphics.particleSize,
  opacity: 0.75,
};

export const SUGAR_POINTS_PARAMS: CommittablePointsParameters = {
  color: new Color("yellow"),
  size: 85,
  opacity: 0.9,
  map: textureFromSpritesheet(2, 2, "transparent"),
};

export class InventoryPoints {
  public waters = configure(new CommittablePoints(10000, WATER_POINTS_PARAMS), (p) => (p.renderOrder = 1));

  public sugars = configure(new CommittablePoints(10000, SUGAR_POINTS_PARAMS), (p) => (p.renderOrder = 1));

  public startFrame() {
    this.waters.startFrame();
    this.sugars.startFrame();
  }

  public endFrame() {
    this.waters.endFrame();
    this.sugars.endFrame();
  }
}

// we represent Resources as dots of certain colors.
export class InventoryRenderer extends Renderer<Inventory> {
  public animationOffset = 0;

  public waters: Vector2[] = [];

  public sugars: Vector2[] = [];

  private activeSugar?: Vector2;

  private stableWater?: Vector2;

  constructor(target: Inventory, scene: Scene, mito: Mito, public particlePoints: InventoryPoints) {
    super(target, scene, mito);
    target.on("get", this.handleGetResources);
    target.on("give", this.handleGiveResources);
    target.on("add", this.handleAddResources);

    this.updateSugarAndWaterParticles();
  }

  public getCarrierPos() {
    return this.target.carrier.pos;
  }

  private handleGetResources = (giver: Inventory) => {
    this.updateSugarAndWaterParticles(giver);
  };

  private verifyArrayLengths() {
    if (this.waters.length !== Math.ceil(this.target.water * graphics.particlesPerWater)) {
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
    this.updateParticlesArray(this.waters, this.target.water * graphics.particlesPerWater, giver);
    this.updateParticlesArray(this.sugars, this.target.sugar, giver);
    this.verifyArrayLengths();
  }

  private updateParticlesArray(particles: Vector2[], resource: number, giver?: Inventory) {
    const wantedParticles = Math.ceil(resource);
    while (particles.length < wantedParticles) {
      // // see if we can find the giver's InventoryRenderer
      // if (giver != null) {
      //   const carrier = giver.carrier;
      //   const carrierRenderer = this.mito.worldRenderer.getOrCreateRenderer(carrier as any);
      //   if (carrierRenderer instanceof InstancedTileRenderer) {
      //     const carrierInventoryRenderer = carrierRenderer.inventoryRenderer;
      //     const
      //   }
      const v = giver != null ? giver.carrier.pos.clone().sub(this.getCarrierPos()) : newParticle();
      v.x += (Math.random() - 0.5) * 0.1;
      v.y += (Math.random() - 0.5) * 0.1;
      particles.push(v);
    }
    if (particles.length > wantedParticles) {
      // delete from the start - makes soil water feel
      // more dynamic since every small movement shows an animation
      // particles.splice(0, particles.length - wantedParticles);

      // delete from the end:
      // otherwise going from 2.1 -> 2 water looks broken
      // (the size 0.1 water suddenly becomes the size 1 water)
      // makes soil water feel much more static
      particles.splice(wantedParticles);
    }
    if (particles.length !== wantedParticles) {
      throw new Error("array lengths mismatch: " + particles.length + " should be " + wantedParticles);
    }
    return particles;
  }

  private commitParticles(particles: CommittablePoints, resource: number, resourceArray: Vector2[]) {
    // this.verifyArrayLengths();
    const numFullSizedParticles = Math.floor(resource);
    for (let i = 0; i < numFullSizedParticles; i++) {
      const p = resourceArray[i];
      particles.commit(p.x + this.getCarrierPos().x, p.y + this.getCarrierPos().y, 10, 1, 1);
    }
    const fract = resource - numFullSizedParticles;
    if (fract > 0) {
      const p = resourceArray[resourceArray.length - 1];
      particles.commit(
        p.x + this.getCarrierPos().x,
        p.y + this.getCarrierPos().y,
        10,
        map(Math.sqrt(fract), 0, 1, 0.2, 1),
        1
      );
    }
  }

  private simulateResourcePositions() {
    const numWaters = this.waters.length;
    const numResources = numWaters + this.sugars.length;
    for (let i = 0; i < numResources; i++) {
      const resource = i < numWaters ? this.waters[i] : this.sugars[i - numWaters];
      let vx = 0,
        vy = 0;

      const angle = Ticker.now / 3000 + this.animationOffset;
      vx += Math.cos(angle) * 0.02;

      const goTowardsCenterStrength = 0.1 + resource.length() * 0.1;
      vx += -resource.x * goTowardsCenterStrength;
      vy += -resource.y * goTowardsCenterStrength;

      // vx += -((r.x * 2) ** 1) * 0.2;
      // vy += -((r.y * 2) ** 3) * 0.1;
      const player = this.mito.world.player;
      if (player.pos.equals(this.target.carrier.pos)) {
        const playerX = player.posFloat.x - player.pos.x;
        const playerY = player.posFloat.y - player.pos.y;
        const offsetX = resource.x - playerX;
        const offsetY = resource.y - playerY;
        const mag2 = offsetX * offsetX + offsetY * offsetY;
        const avoidPlayerStrength = Math.max(Math.min(map(mag2, 0, 1, 3, -5), 3), 0);
        const accelerationX = offsetX * avoidPlayerStrength * 0.2;
        const accelerationY = offsetY * avoidPlayerStrength * 0.2;
        vx += accelerationX;
        vy += accelerationY;
      }
      for (let j = 0; j < numResources; j++) {
        const otherResource = j < numWaters ? this.waters[j] : this.sugars[j - numWaters];
        if (resource === otherResource) {
          break;
        }
        const dx = resource.x - otherResource.x;
        const dy = resource.y - otherResource.y;
        const lengthSq = dx * dx + dy * dy;
        if (lengthSq > 0) {
          // is the other resource a fractional resource
          // true if j is at the last index of the waters, and there is a fractional water,
          // or if j is at the last index of the sugars, and there is a fractional sugar
          const fraction = j < numWaters ? this.target.water % 1 : this.target.sugar % 1;
          const isAtLastResourceOfType = j === numWaters || j === numResources;
          const isOtherResourceFractional = isAtLastResourceOfType && fraction !== 0;
          let strength = graphics.particleRepelStrength / lengthSq; // + graphics.particleRepelStrength / Math.sqrt(lengthSq);
          if (isOtherResourceFractional) {
            strength *= fraction;
          }
          vx += dx * strength;
          vy += dy * strength;
        }
      }
      resource.x += vx;
      resource.y += vy;
      // r.x *= 0.9;
    }
  }

  update() {
    this.simulateResourcePositions();
    this.commitParticles(this.particlePoints.waters, this.target.water * graphics.particlesPerWater, this.waters);
    this.commitParticles(this.particlePoints.sugars, this.target.sugar, this.sugars);
    this.activeSugar = this.sugars[this.sugars.length - 1];
    this.stableWater = this.waters[0];
  }

  destroy() {
    this.target.off("get", this.handleGetResources);
    this.target.off("give", this.handleGiveResources);
    this.target.off("add", this.handleAddResources);
  }

  /**
   * Stores the position of the fractional sugar in the last update.
   * This is used by other renderers to position e.g. eat effects directly
   * on the particle.
   */
  public getActiveSugar() {
    return this.activeSugar;
  }

  /**
   * See getActiveSugar(), but this returns the "oldest" water.
   */
  public getStableWater() {
    return this.stableWater;
  }
}

function newParticle() {
  return new Vector2((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01);
}
