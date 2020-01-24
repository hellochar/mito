import {
  Box3,
  BoxGeometry,
  DoubleSide,
  Geometry,
  Intersection,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Plane,
  PlaneHelper,
  Ray,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import { LightRays } from "../renderers/lightRays";
import { WorldRenderer } from "../renderers/WorldRenderer";
import { Air, Soil, Tile } from "./tile";
import { World } from "./world";

export class LightEmitter {
  public readonly world: World = this.renderer.target;
  private worldRectMin = new Vector2(-0.5, -0.5);
  private worldRectMax = new Vector2(this.world.width - 0.5, this.world.height - 0.5);
  // add a .01 buffer to prevent self-intersecting
  private worldBox = new Box3(
    new Vector3(this.worldRectMin.x - 0.01, this.worldRectMin.y - 0.01, -1),
    new Vector3(this.worldRectMax.x + 0.01, this.worldRectMax.y + 0.01, 1)
  );
  public lightRays = new LightRays();

  public occluderManager = new LightOccluderManager(this.world);

  // TODO don't make this based on the Renderer
  constructor(public renderer: WorldRenderer) {
    const scene = renderer.scene;
    scene.add(this.lightRays.lineSegments);

    scene.add(new PlaneHelper(this.planeTop, 25));
    scene.add(new PlaneHelper(this.planeLeft, 25));
    scene.add(new PlaneHelper(this.planeBottom, 25));
    scene.add(new PlaneHelper(this.planeRight, 25));
  }

  public update(dt: number) {
    this.lightRays.update(dt);

    const angle = this.world.sunAngle;
    const isBrightEnough = angle < Math.PI;
    if (!isBrightEnough) {
      return;
    }

    const occluders: Object3D[] = this.occluderManager.getOccluders();
    // for (let i = 0; i < 10; i++) {
    //   const start = randomRectPerimeter(this.worldRectMin, this.worldRectMax);
    //   this.shootLightRay(dt, start, angle, intersectObjects);
    // }

    const boundingRadius = Math.sqrt(this.world.width ** 2 + this.world.height ** 2);
    const center = this.worldBox.getCenter(new Vector3());
    const distBetweenRays = 5;
    const anglePerpendicular = angle + Math.PI / 2;
    const target = new Vector3();
    const dStart = -boundingRadius + ((this.world.time * 0.1) % 2) * distBetweenRays;
    for (let d = dStart; d <= boundingRadius; d += distBetweenRays) {
      const x = center.x + d * Math.cos(anglePerpendicular);
      const y = center.y + d * Math.sin(anglePerpendicular);
      this.findLightRayRectStart(x, y, angle, target, dt, occluders);
      // this.findLightRayRectStart(x, y, angle - Math.PI, target, dt, intersectObjects);
    }
  }

  private findLightRayRectStart(
    x: number,
    y: number,
    angle: number,
    target: Vector3,
    dt: number,
    intersectObjects: Object3D[]
  ) {
    const ray = new Ray(new Vector3(x, y), new Vector3(-Math.cos(angle), -Math.sin(angle)));
    const intersected = ray.intersectBox(this.worldBox, target) != null;
    if (intersected) {
      this.shootLightRay(dt, new Vector2(target.x, target.y), angle, intersectObjects);
    }
  }

  shootLightRay(dt: number, start: Vector2, angle: number, intersectObjects: Object3D[]) {
    const unitOffsetX = Math.cos(angle);
    const unitOffsetY = Math.sin(angle);

    const rray = new Ray(new Vector3(start.x, start.y, 0), new Vector3(unitOffsetX, unitOffsetY, 0));
    const rayCaster = new Raycaster(rray.origin, rray.direction, 0.1, 2 * (this.world.width + this.world.height));
    const intersections = rayCaster.intersectObjects(intersectObjects);
    if (intersections.length > 0) {
      // console.log(intersections);
      const intersection = intersections[0];
      const { point, object } = intersection;
      const ray = this.lightRays.addRay(start, new Vector2(point.x, point.y), dt);
      if (object.userData instanceof Tile) {
        this.occluderManager.setIntersection(object.userData, intersection);

        // TODO figure this out properly
        ray.hit = object.userData;
      }
    } else {
      // const end = this.intersectWorldPerimeter(rray);
      const end = rray.intersectBox(this.worldBox, this.t);
      if (end != null) {
        this.lightRays.addRay(start, new Vector2(this.t.x, this.t.y), dt);
      }
    }
  }

  planeTop = new Plane(new Vector3(0, -1, 0), this.worldRectMin.y - 0.1);
  planeLeft = new Plane(new Vector3(-1, 0, 0), this.worldRectMin.x - 0.1);
  planeBottom = new Plane(new Vector3(0, -1, 0), this.worldRectMax.y + 0.1);
  planeRight = new Plane(new Vector3(-1, 0, 0), this.worldRectMax.x + 0.1);
  private t: Vector3 = new Vector3();
  private intersectWorldPerimeter(ray: Ray): Vector2 | undefined {
    let intersected =
      (ray.intersectPlane(this.planeTop, this.t) ||
        ray.intersectPlane(this.planeLeft, this.t) ||
        ray.intersectPlane(this.planeBottom, this.t) ||
        ray.intersectPlane(this.planeRight, this.t)) != null;
    if (intersected) {
      return new Vector2(this.t.x, this.t.y);
    } else {
      return;
    }
  }

  inWorldBounds(v: Vector2) {
    return (
      v.x >= this.worldRectMin.x && v.x < this.worldRectMax.x && v.y >= this.worldRectMin.y && v.y < this.worldRectMax.y
    );
  }
}

class LightOccluderManager {
  // TODO weakmap? or some sort of eviction policy?
  private meshCache: Map<Tile, Mesh> = new Map();

  public soilMesh = this.computeSoilMesh();

  constructor(public world: World) {}

  public computeSoilMesh() {
    const soils = Array.from(this.world.allEnvironmentTiles()).filter((t) => t instanceof Soil);
    const geom = new Geometry();
    for (const s of soils) {
      geom.mergeMesh(this.getMesh(s));
    }
    geom.mergeVertices();
    const mat = this.getMesh(soils[0]).material;
    return new Mesh(geom, mat);
  }

  /**
   * Soil doesn't move, so we can make one large static mesh for it
   */
  public getOccluders(): Object3D[] {
    // TODO add DeadCell
    const meshes = Array.from(this.world.allCells())
      .filter((t) => !(t instanceof Air))
      .map((t) => this.getMesh(t));
    meshes.push(this.soilMesh);
    return meshes;
  }

  public getMesh(tile: Tile) {
    if (!this.meshCache.has(tile)) {
      const m = new Mesh(geom, mat);
      m.position.set(tile.pos.x, tile.pos.y, 0);
      m.updateMatrix();
      m.updateMatrixWorld(true);
      m.userData = this;
      this.meshCache.set(tile, m);
    }
    return this.meshCache.get(tile)!;
  }

  private intersections: Map<Tile, Intersection> = new Map();
  setIntersection(tile: Tile, intersection: Intersection) {
    this.intersections.set(tile, intersection);
  }

  getIntersection(tile: Tile) {
    return this.intersections.get(tile);
  }
}

// const geom = new BoxBufferGeometry(1, 1, 1);
const geom = new BoxGeometry(1, 1, 1);
const mat = new MeshBasicMaterial({ side: DoubleSide });
