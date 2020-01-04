import { arrayRange } from "math/arrays";
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments, Vector2, VertexColors } from "three";

const MAX_LIGHTRAYS = 1000;

export class LightRays {
  public positions: Float32BufferAttribute;
  public colors: Float32BufferAttribute;
  public geometry: BufferGeometry;
  public material = new LineBasicMaterial({ vertexColors: VertexColors });
  public lineSegments: LineSegments;
  // private worldRectMin = new Vector2(-0.5, -0.5);
  // private worldRectMax = new Vector2(this.world.width - 0.5, this.world.height - 0.5);

  constructor() {
    this.geometry = new BufferGeometry();
    // each light ray is 2 points (start, end)
    this.positions = new Float32BufferAttribute(arrayRange(3 * MAX_LIGHTRAYS * 2, 0), 3).setDynamic(true);
    this.colors = new Float32BufferAttribute(arrayRange(3 * MAX_LIGHTRAYS * 2, 0), 3).setDynamic(true);
    this.geometry.addAttribute("position", this.positions);
    this.geometry.addAttribute("color", this.colors);
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
      }
    }
    for (const r of died) {
      this.rays.delete(r);
    }
    this.endFrame();
  }

  public addRay(start: Vector2, end: Vector2, extraLife: number) {
    this.rays.add(new LightRay(start, end, extraLife));
  }

  // private addRays(extraLife: number) {
  //   const isBrightEnough = this.world.sunAmount > 0.1;
  //   if (!isBrightEnough) {
  //     return;
  //   }

  //   // add a .01 buffer to prevent self-intersecting
  //   const worldBox = new Box3(
  //     new Vector3(this.worldRectMin.x - 0.01, this.worldRectMin.y - 0.01, -1),
  //     new Vector3(this.worldRectMax.x + 0.01, this.worldRectMax.y + 0.01, 1)
  //   );
  //   for (let i = 0; i < 10; i++) {
  //     const start = randomRectPerimeter(this.worldRectMin, this.worldRectMax);

  //     const angle = this.world.sunAngle;
  //     // const length = 50;
  //     const unitOffsetX = Math.cos(angle);
  //     const unitOffsetY = Math.sin(angle);

  //     // const end = start.clone();
  //     // end.x += unitOffsetX * length;
  //     // end.y += unitOffsetY * length;

  //     const rray = new Ray(new Vector3(start.x, start.y, 0), new Vector3(unitOffsetX, unitOffsetY, 0));
  //     // const rayCaster = new Raycaster();
  //     // rayCaster.intersectObjects()
  //     // const end = this.intersectWorldPerimeter(rray);
  //     const end = rray.intersectBox(worldBox, this.t);
  //     if (end != null) {
  //       const ray = new LightRay(start, new Vector2(this.t.x, this.t.y), extraLife);
  //       this.rays.add(ray);
  //     }
  //   }
  // }

  // planeTop = new Plane(new Vector3(0, -1, 0), this.worldRectMin.y - 0.1);
  // planeLeft = new Plane(new Vector3(-1, 0, 0), this.worldRectMin.x - 0.1);
  // planeBottom = new Plane(new Vector3(0, -1, 0), this.worldRectMax.y + 0.1);
  // planeRight = new Plane(new Vector3(-1, 0, 0), this.worldRectMax.x + 0.1);
  // private t: Vector3 = new Vector3();
  // private intersectWorldPerimeter(ray: Ray): Vector2 | undefined {
  //   let intersected =
  //     (ray.intersectPlane(this.planeTop, this.t) ||
  //       ray.intersectPlane(this.planeLeft, this.t) ||
  //       ray.intersectPlane(this.planeBottom, this.t) ||
  //       ray.intersectPlane(this.planeRight, this.t)) != null;
  //   if (intersected) {
  //     return new Vector2(this.t.x, this.t.y);
  //   } else {
  //     return;
  //   }
  // }

  // inWorldBounds(v: Vector2) {
  //   return (
  //     v.x >= this.worldRectMin.x && v.x < this.worldRectMax.x && v.y >= this.worldRectMin.y && v.y < this.worldRectMax.y
  //   );
  // }
}

const RAY_LIFETIME = 0.2; // seconds
class LightRay {
  public timeRemaining: number;
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
