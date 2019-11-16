import { World } from "sketches/mito/game";
import { Cell, Tile } from "sketches/mito/game/tile";
import { fruitTexture, SPRITESHEET } from "sketches/mito/spritesheet";
import {
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PlaneBufferGeometry,
  RawShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import glsl from "../glsl";

const vertexShader = glsl`
// the vertex shader's main goals are:
// 1. set gl_Position to a clip-coordinate
// 2. pass varyings along to fragment shader.
// you can accept two types of inputs:
//   'attribute' variables, which change per vertex
//   'uniform' variables, which are constant for a given draw context.
// WebGL thankfully hooks up a bunch of attributes and uniforms, see https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram
// see also my explorations: https://codesandbox.io/s/reactthreejstemplate-lwvhu


// Comes from WebGLProgram
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// Comes from threejs Geometry
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// attributes we provide
// these are constant per instance
attribute vec3 instancedTileCenter;
attribute vec3 instancedTileScale;
attribute vec3 instancedTileColor;
attribute vec2 instancedTexturePosition;

// things we pass onto fragment
varying vec3 vColor;
varying vec2 vUv;
varying vec2 vTexturePosition;

// based on https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_instancing_billboards.html
void main() {
  vColor = instancedTileColor;
  vUv = uv;
  vTexturePosition = instancedTexturePosition;

  vec4 mvPosition = modelViewMatrix * vec4(instancedTileCenter, 1.);
  mvPosition.xyz += position * instancedTileScale;
  // mvPosition.xyz += position;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = glsl`
// for the fragment shader, the main goal is to set gl_FragColor. Its inputs are
//   'varying' variables from the vertex shader, interpolated along the triangle
//   'uniform' variables
precision mediump float;

// these should match the corresponding section in the vertexShader exactly
varying vec3 vColor;
varying vec2 vUv;
varying vec2 vTexturePosition;

const vec2 roguelikeSheetSize = vec2(1024., 512.);
uniform sampler2D roguelikeSheet;
uniform sampler2D fruit;

// uv - [0,1]x[0,1] - our local sprite (16x16) UV coords
// texturePosition - the grid x/y where our sprite lives in our texture. NOTE:
// for texturePosition, top-left is 0, 0 (Y is image coordinates)
// textureSize - the pixel width/height of the full spritesheet
// returns: a UV coordinate for this sprite, relative to the full spritesheet
vec2 getCorrectUv(vec2 uv, vec2 texturePosition, vec2 textureSize) {
  vec2 spriteSheetPxStart = texturePosition * vec2(16.);
  spriteSheetPxStart.y = textureSize.y - spriteSheetPxStart.y - 16.;
  vec2 spriteSheetUv = spriteSheetPxStart + uv * vec2(16.);
  return spriteSheetUv / textureSize;
}

void main() {
  vec2 correctUv = getCorrectUv(vUv, vTexturePosition, roguelikeSheetSize);
  vec4 textureColor = texture2D(roguelikeSheet, correctUv);
  if (textureColor.a < 0.5) {
    gl_FragColor = vec4(vColor, 1.);
  } else {
    gl_FragColor = vec4(textureColor.rgb * vColor, textureColor.a);
  }
  // gl_FragColor = vec4(vColor, 1.);
  // gl_FragColor = vec4(0.5, 0.5, 0.2, 1.);
}
`;

const TileShaderMaterial = new RawShaderMaterial({
  uniforms: {
    roguelikeSheet: { value: SPRITESHEET() },
    fruit: { value: fruitTexture },
  },
  vertexShader,
  fragmentShader,
  side: DoubleSide,
  depthTest: false,
  depthWrite: false,
});

class TileBatcher {
  private static newGeometry() {
    const referenceGeometry = new PlaneBufferGeometry(1, 1);
    const geometry = new InstancedBufferGeometry();
    // this copies:
    // [0, 2, 1, 2, 3, 1]
    // index has a specific and somewhat cryptic data storage format
    // it's a flattened array of size three elements
    // each three adjacent numbers gets interpreted as one triangle
    // each individual number's value is an *index* into a "virtual
    // vertex array" that's defined the attributes array.
    geometry.index = referenceGeometry.index;
    // this copies:
    // position: BufferAttribute, 4 items, size 3
    // normal: BufferAttribute, 4 items, size 3
    // uv: BufferAttribute, 4 items, size 2
    geometry.attributes = referenceGeometry.attributes;
    return geometry;
  }

  geometry!: InstancedBufferGeometry;

  public maxTiles = this.world.height * this.world.width * 2;
  centers = new InstancedBufferAttribute(new Float32Array(3 * this.maxTiles), 3, false, 1);
  colors = new InstancedBufferAttribute(new Float32Array(3 * this.maxTiles), 3, false, 1);
  scales = new InstancedBufferAttribute(new Float32Array(3 * this.maxTiles), 3, false, 1);
  texturePositions = new InstancedBufferAttribute(new Float32Array(2 * this.maxTiles), 2, false, 1);

  public readonly mesh: Mesh;

  constructor(public world: World) {
    this.geometry = TileBatcher.newGeometry();
    this.mesh = new Mesh(this.geometry, TileShaderMaterial);
    this.mesh.frustumCulled = false;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.updateMatrixWorld();
    this.centers.setDynamic(true);
    this.colors.setDynamic(true);
    this.scales.setDynamic(true);
    this.texturePositions.setDynamic(true);
    this.geometry.addAttribute("instancedTileCenter", this.centers);
    this.geometry.addAttribute("instancedTileColor", this.colors);
    this.geometry.addAttribute("instancedTileScale", this.scales);
    this.geometry.addAttribute("instancedTexturePosition", this.texturePositions);
  }

  private instances = new Map<string, BatchInstance>();

  // getInstance(layer: number, pos: Vector2) {
  getBatchInstance(tile: Tile) {
    const pos = tile.pos;
    const layer = tile instanceof Cell ? 1 : 0;
    const layerOffset = (layer * this.maxTiles) / 2;
    const positionOffset = pos.y * this.world.width + pos.x;
    const index = layerOffset + positionOffset;
    if (!Number.isInteger(index)) {
      throw new Error("index " + index + " is not integer!");
    }
    const key = String(index);
    if (!this.instances.has(key)) {
      this.instances.set(key, new BatchInstance(this, index));
    }
    const instance = this.instances.get(key)!;
    instance.checkout();
    return instance;
  }

  endFrame() {
    this.centers.needsUpdate = true;
    this.colors.needsUpdate = true;
    this.scales.needsUpdate = true;
    this.texturePositions.needsUpdate = true;
  }
}

const BLACK = new Color(0, 0, 0);
const ZERO = new Vector3(0, 0, 0);
export class BatchInstance {
  public readonly batcher: TileBatcher;
  public readonly index: number;
  private static numInUse = 0;
  private inUse = false;
  constructor(batcher: TileBatcher, index: number) {
    this.batcher = batcher;
    this.index = index;
  }

  checkout() {
    if (this.inUse) {
      throw new Error("Checking out instance that's already in use!" + this.index);
    }
    this.inUse = true;
    BatchInstance.numInUse++;
  }

  commitColor(color: Color) {
    if (!this.inUse) {
      throw new Error("freed tileBatcher still in use!");
    }
    this.batcher.colors.setXYZ(this.index, color.r, color.g, color.b);
  }

  commitCenter(x: number, y: number, z: number) {
    if (!this.inUse) {
      throw new Error("freed tileBatcher still in use!");
    }
    this.batcher.centers.setXYZ(this.index, x, y, z);
  }

  commitScale(scale: Vector3) {
    if (!this.inUse) {
      throw new Error("freed tileBatcher still in use!");
    }
    this.batcher.scales.setXYZ(this.index, scale.x, scale.y, scale.z);
  }

  commitTexturePosition(pos: Vector2) {
    this.batcher.texturePositions.setXY(this.index, pos.x, pos.y);
  }

  destroy() {
    console.log("freeing instance", this.index);
    this.commitColor(BLACK);
    this.commitScale(ZERO);
    this.inUse = false;
    BatchInstance.numInUse--;
  }
}

export default TileBatcher;
