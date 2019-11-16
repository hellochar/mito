import { easeCubic } from "d3-ease";
import Ticker from "global/ticker";
import { clamp, lerp, lerp2, map } from "math";
import { reversed } from "math/easing";
import React from "react";
import Mito from "sketches/mito";
import { blopBuffer, suckWaterBuffer } from "sketches/mito/audio";
import { Constructor } from "sketches/mito/constructor";
import { Temperature } from "sketches/mito/game/temperature";
import {
  Air,
  Cell,
  DeadCell,
  Fountain,
  Fruit,
  GrowingCell,
  hasEnergy,
  hasTilePairs,
  Leaf,
  Rock,
  Root,
  Soil,
  Tile,
  Tissue,
  Transport,
} from "sketches/mito/game/tile";
import { hasInventory } from "sketches/mito/inventory";
import { params } from "sketches/mito/params";
import { WorldDOMElement } from "sketches/mito/WorldDOMElement";
import {
  ArrowHelper,
  Audio,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Object3D,
  Scene,
  Vector2,
  Vector3,
} from "three";
import { CellEffectsRenderer } from "../CellEffectsRenderer";
import { InventoryRenderer } from "../InventoryRenderer";
import { Renderer } from "../Renderer";
import TileBatcher, { BatchInstance } from "./tileBatcher";

type Animation = (dt: number) => boolean;

class AnimationController {
  animation?: Animation;
  timeStarted?: number;

  set(a: Animation, now: number) {
    this.animation = a;
    this.timeStarted = now;
  }

  update(now: number) {
    if (this.animation != null && this.timeStarted != null) {
      const dt = now - this.timeStarted;
      const ended = this.animation(dt);
      if (ended) {
        this.animation = undefined;
        this.timeStarted = undefined;
      }
    }
  }
}

export class InstancedTileRenderer<T extends Tile = Tile> extends Renderer<T> {
  public static readonly TEMPERATURE_COLORS = {
    [Temperature.Scorching]: new Color("orange"),
    [Temperature.Hot]: new Color("orange").lerp(new Color("white"), 0.5),
    [Temperature.Mild]: new Color("white"),
    [Temperature.Cold]: new Color("lightblue").lerp(new Color("white"), 0.5),
    [Temperature.Freezing]: new Color("lightblue"),
  } as Record<Temperature, Color>;

  private static ONE = new Vector2(1, 1);

  private inventoryRenderer?: InventoryRenderer;
  private originalColor: Color;
  private audio?: Audio;
  private lastAudioValueTracker = 0;
  private pairsLines = new Object3D();
  private worldDomElement?: WorldDOMElement;
  private cellEffectsRenderer?: CellEffectsRenderer;
  private animation = new AnimationController();

  private scale = new Vector3(1, 1, 1);
  private color = new Color();

  private instance: BatchInstance;

  get materialInfo() {
    return getMaterialInfo(this.target);
  }

  constructor(target: T, scene: Scene, mito: Mito, batchMesh: TileBatcher) {
    super(target, scene, mito);
    this.instance = batchMesh.getBatchInstance(target);
    if (this.target instanceof GrowingCell) {
      this.scale.set(0.01, 0.01, 1);
    }

    this.originalColor = this.materialInfo.color.clone();
    if (hasInventory(this.target)) {
      this.inventoryRenderer = new InventoryRenderer(this.target.inventory, this.scene, this.mito);
      this.inventoryRenderer.animationOffset = (this.target.pos.x + this.target.pos.y) / 2;
    }
    if (this.target instanceof Cell) {
      // if it takes no turns to build, start it off small just for show
      if (!(this.target.constructor as Constructor<Cell>).turnsToBuild) {
        this.scale.set(0.01, 0.01, 1);
      }
    }
    if (this.target instanceof Leaf || this.target instanceof Root) {
      this.audio = new Audio(this.mito.audioListener);
      // TODO do audio
      // this.mesh.add(this.audio);
    }

    if (this.target instanceof Fruit) {
      const fruit = this.target;
      this.worldDomElement = mito.addWorldDOMElement(
        () => this.target.pos,
        () => {
          return (
            <div className="fruit-indicator">
              <div>
                {fruit.committedResources.water.toFixed(1)}/{fruit.neededResources / 2} water
              </div>
              <div>
                {fruit.committedResources.sugar.toFixed(1)}/{fruit.neededResources / 2} sugar
              </div>
            </div>
          );
        }
      );
    }

    // TODO do cell effects
    // if (this.target instanceof Cell) {
    //   this.cellEffectsRenderer = new CellEffectsRenderer((this as unknown) as InstancedTileRenderer<Cell>);
    // }

    // TODO fix this clobbering with GrowingCell
    this.commit();
  }

  commit() {
    if (this.target instanceof Cell) {
      this.instance.commitCenter(this.target.pos.x, this.target.pos.y + this.target.droopY, 1);
    } else {
      this.instance.commitCenter(this.target.pos.x, this.target.pos.y, 0);
    }
    this.instance.commitTexturePosition(this.materialInfo.texturePosition);
    this.instance.commitColor(this.color);
    this.instance.commitScale(this.scale);
  }

  update() {
    const lightAmount = this.target.lightAmount();
    this.updateVisibility(lightAmount);
    this.updateSize();
    this.updateColor(lightAmount);

    this.respondToEvents();

    if (this.cellEffectsRenderer != null) {
      this.cellEffectsRenderer.update();
    }

    this.animation.update(Ticker.now / 1000);
    this.commit();
  }

  updateVisibility(lightAmount: number) {
    // visibility
    if (lightAmount > 0) {
      // TODO handle visibility
      // if (this.mesh.parent == null) {
      //   this.scene.add(this.mesh);
      // }

      if (this.inventoryRenderer != null) {
        // will not render without an update
        this.inventoryRenderer.update();
      }
    }
    // else if (this.mesh.parent != null) {
    //   this.scene.remove(this.mesh);
    // }
  }

  updateSize() {
    if (this.target instanceof GrowingCell) {
      const s = 1 - this.target.timeRemaining / this.target.timeToBuild;
      lerp2(this.scale, { x: s, y: s }, 0.5);
    } else if (this.target instanceof Fruit) {
      const scale = map(this.target.getPercentMatured(), 0, 1, 0.2, 1);
      const targetScale = new Vector2(scale, scale);
      lerp2(this.scale, targetScale, 0.1);
    } else {
      lerp2(this.scale, InstancedTileRenderer.ONE, 0.1);
    }
  }

  updateColor(lightAmount: number) {
    if (this.target instanceof Air) {
      const colorIndex = Math.max(0, map(this.target.co2(), 1 / 6, 1.001, 0, AIR_COLORSCALE.length - 1));
      const startColorIndex = Math.floor(colorIndex);
      const startColor = AIR_COLORSCALE[startColorIndex];
      this.originalColor = startColor.clone();
      if (startColorIndex !== AIR_COLORSCALE.length - 1) {
        const alpha = colorIndex - startColorIndex;
        const endColorIndex = startColorIndex + 1;
        const endColor = AIR_COLORSCALE[endColorIndex];
        this.originalColor.lerp(endColor, alpha);
      }
    }
    this.color.copy(this.originalColor);
    if (hasEnergy(this.target)) {
      this.color.lerp(new Color(0), 1 - this.target.energy / params.cellEnergyMax);
    }

    this.color = this.lerpColorTemperature(this.color);
    this.color = new Color(0).lerp(this.color, map(lightAmount, 0, 1, 0.2, 1));
  }

  respondToEvents() {
    // audio
    if (this.target instanceof Leaf && this.audio != null) {
      const newAudioValueTracker = this.target.totalSugarProduced;
      if (newAudioValueTracker > this.lastAudioValueTracker) {
        this.audio.setBuffer(blopBuffer);
        const dist = this.target.pos.distanceToSquared(this.mito.world.player.pos);
        const volume = Math.min(1, 1 / (1 + dist / 25)) * this.target.sugarConverted * this.target.sugarConverted;
        this.audio.setVolume(volume);
        // this.audio.setRefDistance(2);
        // play blop sound
        this.audio.play();
        this.animation.set(this.growPulseAnimation(), Ticker.now / 1000);
      }
      this.lastAudioValueTracker = newAudioValueTracker;
    }
    if (this.target instanceof Root && this.audio != null) {
      const newAudioValueTracker = this.target.totalSucked;
      if (newAudioValueTracker !== this.lastAudioValueTracker) {
        this.audio.setBuffer(suckWaterBuffer);
        // const baseVolume = this.target.waterTransferAmount / (2 + this.target.waterTransferAmount);
        const baseVolume = 1;
        const dist = this.target.pos.distanceToSquared(this.mito.world.player.pos);
        const volume = Math.min(1, 1 / (1 + dist / 25)) * baseVolume;
        this.audio.setVolume(volume);
        if (this.audio.source != null) {
          this.audio.stop();
        }
        this.audio.play();
        this.animation.set(this.growPulseAnimation(), Ticker.now / 1000);
      }
      this.lastAudioValueTracker = newAudioValueTracker;
    }
    this.scene.remove(this.pairsLines);
  }

  private temperatureColor: Color = InstancedTileRenderer.TEMPERATURE_COLORS[Temperature.Mild];
  private currentLerp = 0;
  lerpColorTemperature(color: Color) {
    const { temperature } = this.target;
    let tColor = InstancedTileRenderer.TEMPERATURE_COLORS[temperature];
    if (tColor !== this.temperatureColor) {
      this.currentLerp = 0;
    }
    const targetLerp = temperature === Temperature.Mild ? 0 : 0.5;
    this.temperatureColor = tColor;
    this.currentLerp = lerp(this.currentLerp, targetLerp, 0.1);
    color.lerp(this.temperatureColor, this.currentLerp);
    return color;
  }

  updateHover() {
    this.scene.add(this.pairsLines);
    if (hasTilePairs(this.target)) {
      const pairColor = this.target instanceof Leaf ? 0xffc90e : new Color("rgb(9, 12, 255)").getHex();
      const pairs = this.target.tilePairs;
      if (pairs.length !== this.pairsLines.children.length) {
        // redo pairs
        this.pairsLines.remove(...this.pairsLines.children);
        pairs.forEach((dir) => {
          const length = dir.length() * 2 - 0.25;
          const arrowDir = new Vector3(dir.x, dir.y, 0).normalize();
          const arrowHelper = this.makeLine(arrowDir, arrowDir.clone().multiplyScalar(-length / 2), length, pairColor);
          this.pairsLines.add(arrowHelper);
        });
      }
    }
    if (this.hasActiveNeighbors(this.target)) {
      const color = this.target instanceof Root ? new Color("rgb(9, 12, 255)").getHex() : 0xffffff;
      const lines = this.target.activeNeighbors;
      if (lines.length !== this.pairsLines.children.length) {
        // redo pairs
        this.pairsLines.remove(...this.pairsLines.children);
        lines.forEach((dir) => {
          const length = dir.length() - 0.25;
          const arrowDir = new Vector3(dir.x, dir.y, 0).normalize();
          const arrowHelper =
            this.target instanceof Root
              ? this.makeLine(arrowDir, new Vector3(), length, color)
              : new ArrowHelper(arrowDir, new Vector3(0, 0, 5), length, color);
          this.pairsLines.add(arrowHelper);
        });
      }
    }
  }

  growPulseAnimation(): Animation {
    const duration = 0.5;
    const ease = reversed(easeCubic);
    return (dt) => {
      const t = clamp((dt / duration) * ((this.target as any).tempo || 1), 0, 1);
      const scale = map(ease(t), 0, 1, 1, 1.3);
      this.scale.setScalar(scale);
      return t >= 1;
    };
  }

  hasActiveNeighbors(
    t: any
  ): t is {
    activeNeighbors: Vector2[];
  } {
    return Array.isArray(t.activeNeighbors);
  }

  static lineGeometry = (() => {
    const g = new BufferGeometry();
    g.addAttribute("position", new Float32BufferAttribute([0, 0, 0, 0, 1, 0], 3));
    return g;
  })();
  private makeLine(dir: Vector3, origin: Vector3, length: number, color: number) {
    // copied from https://github.com/mrdoob/js/blob/master/src/helpers/ArrowHelper.js
    const line = new Line(InstancedTileRenderer.lineGeometry, new LineBasicMaterial({ color: color }));
    line.position.copy(origin);
    // dir is assumed to be normalized
    if (dir.y > 0.99999) {
      line.quaternion.set(0, 0, 0, 1);
    } else if (dir.y < -0.99999) {
      line.quaternion.set(1, 0, 0, 0);
    } else {
      const axis = new Vector3(dir.z, 0, -dir.x).normalize();
      const radians = Math.acos(dir.y);
      line.quaternion.setFromAxisAngle(axis, radians);
    }
    line.scale.set(1, Math.max(0, length), 1);
    line.position.z = 0.1;
    line.updateMatrix();
    line.matrixAutoUpdate = false;
    return line;
  }
  destroy() {
    this.instance.destroy();
    // this.scene.remove(this.mesh);
    if (this.worldDomElement != null) {
      this.mito.removeWorldDOMElement(this.worldDomElement);
    }
    if (this.inventoryRenderer != null) {
      this.inventoryRenderer.destroy();
    }
    if (this.cellEffectsRenderer != null) {
      this.cellEffectsRenderer.destroy();
    }
  }
}

interface MaterialInfo {
  color: Color;
  // TODO implement texturePosition
  texturePosition: Vector2;
}

export const materialInfoMapping = (() => {
  const materials = new Map<Constructor<Tile>, MaterialInfo>();
  materials.set(Air, {
    texturePosition: new Vector2(0, 0),
    color: new Color("white"),
  });
  materials.set(Soil, {
    texturePosition: new Vector2(8, 11),
    color: new Color("rgb(112, 89, 44)"),
  });
  materials.set(Fountain, {
    color: new Color("white"),
    texturePosition: new Vector2(56 / 16, 38 / 16).floor(),
  });
  materials.set(Rock, {
    texturePosition: new Vector2(26, 20),
    color: new Color("rgb(63, 77, 84)"),
  });
  materials.set(DeadCell, {
    texturePosition: new Vector2(137 / 16, 374 / 16).floor(),
    color: new Color("rgb(128, 128, 128)"),
  });
  materials.set(Tissue, {
    texturePosition: new Vector2(6, 31),
    color: new Color(0x30ae25),
  });
  materials.set(Transport, materials.get(Tissue)!);
  materials.set(Leaf, {
    color: new Color("white"),
    texturePosition: new Vector2(55 / 16, 280 / 16).floor(),
  });
  materials.set(Root, {
    color: new Color("white"),
    texturePosition: new Vector2(59 / 16, 327 / 16).floor(),
  });
  materials.set(Fruit, {
    texturePosition: new Vector2(0, 0),
    color: new Color("white"),
  });
  return materials;
})();

function getMaterialInfo(tile: Tile): MaterialInfo {
  if (tile instanceof GrowingCell) {
    return getMaterialInfo(tile.completedCell);
  } else {
    return materialInfoMapping.get(tile.constructor as Constructor<Tile>)!;
  }
}

const AIR_COLORSCALE = [
  new Color("hsl(67, 31%, 25%)"),
  new Color("hsl(180, 31%, 76%)"),
  new Color("hsl(213, 63%, 58%)"),
];
