import { BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, Points, ShaderMaterial, Texture } from "three";
import glsl from "./glsl";

export class CommittablePoints extends Points {
  public geometry: BufferGeometry;

  public material: ResourcePointsMaterial;

  static newGeometry(size: number) {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(size * 3);
    const rotations = new Float32Array(size);
    const sizes = new Float32Array(size);
    const alphas = new Float32Array(size);
    geometry.setAttribute("position", new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
    geometry.setAttribute("rotation", new BufferAttribute(rotations, 1).setUsage(DynamicDrawUsage));
    geometry.setAttribute("size", new BufferAttribute(sizes, 1).setUsage(DynamicDrawUsage));
    geometry.setAttribute("alpha", new BufferAttribute(alphas, 1).setUsage(DynamicDrawUsage));
    return geometry;
  }

  constructor(size: number, public params: CommittablePointsParameters) {
    super();
    this.geometry = CommittablePoints.newGeometry(size);
    this.material = new ResourcePointsMaterial(params);
    this.frustumCulled = false;
  }

  private index = 0;

  startFrame() {
    this.index = 0;
  }

  commit(x: number, y: number, z: number, size: number, alpha: number, r?: number) {
    this.geometry.attributes.position.setXYZ(this.index, x, y, z);
    this.geometry.attributes.size.setX(this.index, size);
    this.geometry.attributes.alpha.setX(this.index, alpha);
    if (r != null) {
      this.geometry.attributes.rotation.setX(this.index, r);
    }
    this.index++;
  }

  endFrame() {
    const positions = this.geometry.attributes.position as BufferAttribute;
    positions.needsUpdate = true;
    const sizes = this.geometry.attributes.size as BufferAttribute;
    sizes.needsUpdate = true;
    const rotations = this.geometry.attributes.rotation as BufferAttribute;
    rotations.needsUpdate = true;
    const alphas = this.geometry.attributes.alpha as BufferAttribute;
    alphas.needsUpdate = true;
    this.geometry.setDrawRange(0, this.index);
  }
}

export interface CommittablePointsParameters {
  opacity: number;
  color: Color;
  size: number;
  map?: Texture;
}

class ResourcePointsMaterial extends ShaderMaterial {
  public map: Texture | undefined;

  constructor(public params: CommittablePointsParameters) {
    super({
      uniforms: {
        opacity: { value: params.opacity },
        sizeGlobal: { value: params.size },
        color: { value: params.color },
        // you have to put it here too
        map: { value: params.map },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      transparent: true,
    } as any);

    // OH MY GOD you can do this. You have to do this *AFTER* the super call!
    // This hooks into threejs WebGLProgram's built-in properties that hooks up
    // various named textures to glsl variables and #DEFINEs.
    this.map = params.map;
  }
}

const vertexShader = glsl`
attribute float size;
attribute float rotation;
attribute float alpha;
uniform float sizeGlobal;

varying float vAlpha;
varying float vRotation;

void main() {
  vRotation = rotation;
  vAlpha = alpha;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = size * sizeGlobal * -projectionMatrix[1].y;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = glsl`
uniform vec3 color;
uniform sampler2D texture;
uniform float opacity;

varying float vRotation;
varying float vAlpha;

#ifdef USE_MAP
  uniform mat3 uvTransform;
  uniform sampler2D map;
#endif

vec2 rotateAround ( in vec2 v, in vec2 center, in float angle ) {

  float c = cos( angle );
  float s = sin( angle );

  float x = v.x - center.x;
  float y = v.y - center.y;

  vec2 r = vec2(x * c - y * s + center.x, x * s + y * c + center.y);

  return r;
}

float zeroToOne(float x) {
    return step(0., x) * (1. - step(1., x));
}

float inSquare(vec2 v) {
  float xMult = zeroToOne(v.x);
  float yMult = zeroToOne(v.y);
  return xMult * yMult;
}

void main() {
  gl_FragColor = vec4( color, 1. );
  float alpha = vAlpha;

  #ifdef USE_MAP
    vec2 uv = gl_PointCoord;

    // flip vRotation to account for flipped y viewport
    uv = rotateAround(uv, vec2(0.5), -vRotation); //, vec2(0.), vec2(1.));

    // if we're out of the UV clamped edge, set alpha to 0
    alpha *= inSquare(uv);

    vec4 mapTexel = texture2D( map, uv );
    gl_FragColor *= mapTexelToLinear( mapTexel );
  #endif
  gl_FragColor.a *= opacity * alpha;
}
`;
