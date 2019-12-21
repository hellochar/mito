import { BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial, Texture } from "three";
import glsl from "./glsl";

export class CommittablePoints extends Points {
  public geometry: BufferGeometry;
  public material: ResourcePointsMaterial;
  static newGeometry(size: number) {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(size * 3);
    const sizes = new Float32Array(size);
    geometry.addAttribute("position", new BufferAttribute(positions, 3).setDynamic(true));
    geometry.addAttribute("size", new BufferAttribute(sizes, 1).setDynamic(true));
    return geometry;
  }

  constructor(size: number, params: CommittablePointsParameters) {
    super();
    this.geometry = CommittablePoints.newGeometry(size);
    this.material = new ResourcePointsMaterial(params);
    this.frustumCulled = false;
  }
  private index = 0;
  startFrame() {
    this.index = 0;
  }
  commit(x: number, y: number, z: number, size: number) {
    this.geometry.attributes.position.setXYZ(this.index, x, y, z);
    this.geometry.attributes.size.setX(this.index, size);
    this.index++;
  }
  endFrame() {
    const positions = this.geometry.attributes.position as BufferAttribute;
    positions.needsUpdate = true;
    const sizes = this.geometry.attributes.size as BufferAttribute;
    sizes.needsUpdate = true;
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
uniform float sizeGlobal;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = size * sizeGlobal * -projectionMatrix[1].y;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = glsl`
uniform vec3 color;
uniform sampler2D texture;
uniform float opacity;

#ifdef USE_MAP
  uniform mat3 uvTransform;
  uniform sampler2D map;
#endif

void main() {
    gl_FragColor = vec4( color, opacity );

    #ifdef USE_MAP
        vec4 mapTexel = texture2D( map, gl_PointCoord );
        gl_FragColor *= mapTexelToLinear( mapTexel );
    #endif
}
`;
