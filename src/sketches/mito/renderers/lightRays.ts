import { arrayRange } from "math/arrays";
import {
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Vector2,
  VertexColors,
} from "three";
import { Tile } from "../game/tile";

const MAX_LIGHTRAYS = 1000;

export class LightRays {
  public positions: Float32BufferAttribute;
  public colors: Float32BufferAttribute;
  public geometry: BufferGeometry;
  public material = new LineBasicMaterial({ vertexColors: VertexColors });
  public lineSegments: LineSegments;

  constructor() {
    this.geometry = new BufferGeometry();
    // each light ray is 2 points (start, end)
    this.positions = new Float32BufferAttribute(arrayRange(3 * MAX_LIGHTRAYS * 2, 0), 3).setUsage(DynamicDrawUsage);
    this.colors = new Float32BufferAttribute(arrayRange(3 * MAX_LIGHTRAYS * 2, 0), 3).setUsage(DynamicDrawUsage);
    this.geometry.setAttribute("position", this.positions);
    this.geometry.setAttribute("color", this.colors);
    this.lineSegments = new LineSegments(this.geometry, this.material);
    this.lineSegments.frustumCulled = false;
    this.lineSegments.renderOrder = 1;
  }

  private index = 0;
  private startFrame() {
    this.index = 0;
  }

  commit(start: Vector2, end: Vector2, b: number) {
    // TODO turn this into opacity, not color
    // const b = this.world.sunAmount * brightness;
    const z = 10;
    this.positions.setXYZ(this.index, start.x, start.y, z);
    this.colors.setXYZ(this.index, b, b, b);
    this.index++;
    this.positions.setXYZ(this.index, end.x, end.y, z);
    this.colors.setXYZ(this.index, b, b, b);
    this.index++;
  }

  private endFrame() {
    const positions = this.positions;
    positions.needsUpdate = true;
    const colors = this.colors;
    colors.needsUpdate = true;
    this.geometry.setDrawRange(0, this.index);
  }

  private rays = new Set<LightRay>();

  update(dt: number) {
    this.startFrame();
    // this.addRays(dt);
    const died: LightRay[] = [];
    for (const ray of this.rays) {
      ray.update(dt, this);
      if (ray.isDead()) {
        died.push(ray);
        if (ray.hit) {
          // TODO figure this out
          // ray.occluderManager.setIntersection(ray.hit, undefined);
          // ray.hit.lightIntersection = undefined;
        }
      }
    }
    for (const r of died) {
      this.rays.delete(r);
    }
    this.endFrame();
  }

  public addRay(start: Vector2, end: Vector2, extraLife: number) {
    const ray = new LightRay(start, end, extraLife);
    this.rays.add(ray);
    return ray;
  }
}

const RAY_LIFETIME = 0.1; // seconds
class LightRay {
  public timeRemaining: number;
  public hit?: Tile;

  constructor(public start: Vector2, public end: Vector2, extraTime: number) {
    this.timeRemaining = RAY_LIFETIME + extraTime;
  }

  update(dt: number, owner: LightRays) {
    this.timeRemaining -= dt;
    // const tNorm = this.timeRemaining / RAY_LIFETIME;
    // const brightness = polyUpDown(tNorm) ** (1 / 8);
    const brightness = 1;
    owner.commit(this.start, this.end, brightness);
  }

  isDead() {
    return this.timeRemaining <= 0;
  }
}
