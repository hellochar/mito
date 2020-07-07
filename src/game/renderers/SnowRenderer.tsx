import snowUrl from "assets/images/snow.png";
import { Temperature } from "core/temperature";
import { Weather } from "core/world/weather";
import { lerpLinear } from "math";
import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  Texture,
  TextureLoader,
  Vector2,
} from "three";

export class SnowRenderer {
  static geometry = new PlaneGeometry(50, 100);

  snowMesh: Mesh;

  snowMap: Texture;

  enabledOpacity: number;

  snowMaterial: MeshBasicMaterial;

  constructor(public target: Weather, public scene: Scene, public readonly scalar = 1) {
    this.snowMap = new TextureLoader().load(snowUrl, (texture) => {
      texture.magFilter = texture.minFilter = NearestFilter;
      texture.flipY = true;
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat = new Vector2(3 * scalar, 6 * scalar);
    });
    this.enabledOpacity = 0.4 / scalar;
    this.snowMaterial = new MeshBasicMaterial({
      map: this.snowMap,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: DoubleSide,
    });
    this.snowMesh = new Mesh(SnowRenderer.geometry, this.snowMaterial);
    this.snowMesh.position.set(25, 50, -9);
    this.snowMesh.renderOrder = 1;
    scene.add(this.snowMesh);
  }

  update() {
    const targetOpacity = this.target.getBaseTemperature() < Temperature.Mild ? this.enabledOpacity : 0;
    if (this.snowMaterial.opacity !== targetOpacity) {
      this.snowMaterial.opacity = lerpLinear(this.snowMaterial.opacity, targetOpacity, this.enabledOpacity * 0.02);
      this.snowMaterial.needsUpdate = true;
    }
    this.snowMap.offset.x -= 0.0001 / this.scalar;
    this.snowMap.offset.y -= 0.0005 / this.scalar;
  }
}
