import { World } from "core";
import { Cell, Tile } from "core/tile";
import { SPRITESHEET } from "game/spritesheet";
import {
  Color,
  DoubleSide,
  DynamicDrawUsage,
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
precision mediump float;

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
attribute vec3 centers;
attribute vec3 scales;
attribute vec3 colors;
attribute vec2 texturePositions;
attribute float alphas;

// things we pass onto fragment
varying vec3 vTileCenter;
varying vec3 vColor;
varying vec2 vUv;
varying vec2 vTexturePosition;
varying float vAlpha;

// based on https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_instancing_billboards.html
void main() {
  vTileCenter = centers;
  vColor = colors;
  vUv = uv;
  vTexturePosition = texturePositions;
  vAlpha = alphas;

  vec4 mvPosition = modelViewMatrix * vec4(centers, 1.);
  mvPosition.xyz += position * scales;
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
varying vec3 vTileCenter;
varying vec3 vColor;
varying vec2 vUv;
varying vec2 vTexturePosition;
varying float vAlpha;

const vec2 spritesheetSize = vec2(256., 256.);
const vec2 spriteSize = vec2(32.);
uniform sampler2D spriteSheet;

float myRound(float x) {
  return sign(x) * floor(abs(x) + 0.5);
}

// uv - [0,1]x[0,1] - our local sprite (32x32) UV coords
// texturePosition - the grid x/y where our sprite lives in our texture. NOTE:
// for texturePosition, top-left is 0, 0 (Y is image coordinates)
// textureSize - the pixel width/height of the full spritesheet
// returns: a UV coordinate for this sprite, relative to the full spritesheet
vec2 getCorrectUv(vec2 uv, vec2 texturePosition) {
  vec2 spriteSheetPxStart = texturePosition * spriteSize;
  spriteSheetPxStart.y = spritesheetSize.y - spriteSheetPxStart.y - spriteSize.y;
  vec2 spriteSheetUv = spriteSheetPxStart + uv * spriteSize;
  vec2 minUv = spriteSheetPxStart;
  vec2 maxUv = spriteSheetPxStart + spriteSize;
  return clamp(spriteSheetUv / spritesheetSize, minUv / spritesheetSize, maxUv / spritesheetSize);
}

void main() {
  vec2 correctUv = getCorrectUv(vUv, vTexturePosition);
  vec4 textureColor = texture2D(spriteSheet, correctUv);
  gl_FragColor = vec4(textureColor.rgb * vColor, textureColor.a * vAlpha);
}
`;

function newTileShaderMaterial() {
  return new RawShaderMaterial({
    uniforms: {
      spriteSheet: { value: SPRITESHEET() },
    },
    transparent: true,
    vertexShader,
    fragmentShader,
    side: DoubleSide,
  });
}

function newTileBatcherGeometry() {
  // overdraw just a tiny bit to prevent aliased black lines from appearing
  // in various zoom levels
  const referenceGeometry = new PlaneBufferGeometry(1.01, 1.01);
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

class TileBatcher {
  private geometry = newTileBatcherGeometry();

  public readonly maxTiles = this.world.height * this.world.width * 2;

  centers = this.attr(3);

  colors = this.attr(3);

  scales = this.attr(3);

  texturePositions = this.attr(2);

  alphas = this.attr(1, 1);

  private attr(dim: number, fill = 0) {
    const attr = new InstancedBufferAttribute(new Float32Array(this.maxTiles * dim).fill(fill), dim, false, 1);
    attr.setUsage(DynamicDrawUsage);
    return attr;
  }

  public readonly mesh: Mesh;

  constructor(public world: World) {
    this.mesh = new Mesh(this.geometry, newTileShaderMaterial());
    this.mesh.name = "TileBatcher Mesh";
    this.mesh.frustumCulled = false;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.updateMatrixWorld();

    for (const prop in this) {
      const v = this[prop];
      if (v instanceof InstancedBufferAttribute) {
        this.geometry.setAttribute(prop, v);
      }
    }
  }

  private instances = new Map<string, BatchInstance>();

  // getInstance(layer: number, pos: Vector2) {
  getBatchInstance(tile: Tile) {
    const pos = tile.pos;
    const layer = Cell.is(tile) ? 1 : 0;
    const layerOffset = (layer * this.maxTiles) / 2;
    const positionOffset = pos.y * this.world.width + pos.x;
    const index = layerOffset + positionOffset;
    if (!Number.isInteger(index)) {
      console.error("index " + index + " is not integer!");
    }
    const key = String(index);
    if (!this.instances.has(key)) {
      this.instances.set(key, new BatchInstance(this, index));
    }
    const instance = this.instances.get(key)!;
    instance.checkout(tile);
    return instance;
  }

  endFrame() {
    for (const prop in this) {
      const v = this[prop];
      if (v instanceof InstancedBufferAttribute) {
        v.needsUpdate = true;
      }
    }
  }
}

export const BLACK = new Color(0, 0, 0);
const ZERO = new Vector3(0, 0, 0);
export class BatchInstance {
  public readonly batcher: TileBatcher;

  public readonly index: number;

  private static numInUse = 0;

  private owner?: object;

  constructor(batcher: TileBatcher, index: number) {
    this.batcher = batcher;
    this.index = index;
  }

  checkout(owner: object) {
    if (this.owner != null) {
      // throw new Error("Checking out instance that's already in use!" + this.index);
      console.warn("Checking out instance that's already in use!", this.index, owner);
    }
    this.owner = owner;
    BatchInstance.numInUse++;
  }

  commitColor(r: number, g: number, b: number) {
    if (!this.owner) {
      console.error("freed tileBatcher still in use!");
    }
    this.batcher.colors.setXYZ(this.index, r, g, b);
  }

  commitCenter(x: number, y: number, z: number) {
    if (!this.owner) {
      console.error("freed tileBatcher still in use!");
    }
    this.batcher.centers.setXYZ(this.index, x, y, z);
  }

  commitScale(scale: Vector3) {
    if (!this.owner) {
      console.error("freed tileBatcher still in use!");
    }
    this.batcher.scales.setXYZ(this.index, scale.x, scale.y, scale.z);
  }

  commitTexturePosition(pos: Vector2) {
    this.batcher.texturePositions.setXY(this.index, pos.x, pos.y);
  }

  commitAlpha(alpha: number) {
    this.batcher.alphas.setX(this.index, alpha);
  }

  destroy() {
    this.commitColor(0, 0, 0);
    this.commitScale(ZERO);
    this.owner = undefined;
    BatchInstance.numInUse--;
  }
}

export default TileBatcher;
