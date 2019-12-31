import { easeCubic } from "d3-ease";
import { clamp, lerp, lerp2, map } from "math";
import { reversed } from "math/easing";
import Mito from "sketches/mito";
import { blopBuffer, suckWaterBuffer } from "sketches/mito/audio";
import { Constructor } from "sketches/mito/constructor";
import { CELL_MAX_ENERGY } from "sketches/mito/game/constants";
import { Temperature } from "sketches/mito/game/temperature";
import {
  Air,
  Cell,
  DeadCell,
  Fountain,
  Fruit,
  GrowingCell,
  Leaf,
  Rock,
  Root,
  Tile,
  Tissue,
  Transport,
} from "sketches/mito/game/tile";
import { Clay, Sand, Silt } from "sketches/mito/game/tile/soil";
import {
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
import { InventoryRenderer } from "../InventoryRenderer";
import { Renderer } from "../Renderer";
import { Animation, AnimationController } from "./Animation";
import { CellEffectsRenderer } from "./CellEffectsRenderer";
import TileBatcher, { BatchInstance } from "./tileBatcher";

export class InstancedTileRenderer<T extends Tile = Tile> extends Renderer<T> {
  public static readonly TEMPERATURE_COLORS = {
    [Temperature.Scorching]: new Color("orange"),
    [Temperature.Hot]: new Color("orange").lerp(new Color("white"), 0.5),
    [Temperature.Mild]: new Color("white"),
    [Temperature.Cold]: new Color("lightblue").lerp(new Color("white"), 0.5),
    [Temperature.Freezing]: new Color("lightblue"),
  } as Record<Temperature, Color>;

  private static readonly ONE = Object.freeze(new Vector2(1, 1));

  public inventoryRenderer: InventoryRenderer;
  private originalColor: Color;
  private audio?: Audio;
  private lastAudioValueTracker = 0;
  private neighborLines = new Object3D();
  private cellEffectsRenderer?: CellEffectsRenderer;
  protected animation = new AnimationController();

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

    this.originalColor = (this.materialInfo.color || WHITE).clone();
    this.inventoryRenderer = new InventoryRenderer(this.target.inventory, this.scene, this.mito);
    this.inventoryRenderer.animationOffset = (this.target.pos.x + this.target.pos.y) / 2;
    if (this.target instanceof Cell) {
      // if it takes no time to build, start it off small just for show
      if (!(this.target.constructor as Constructor<Cell>).timeToBuild) {
        this.scale.set(0.01, 0.01, 1);
      }
    }
    if (this.target instanceof Leaf || this.target instanceof Root) {
      this.audio = new Audio(this.mito.audioListener);
    }

    if (this.target instanceof Cell) {
      this.cellEffectsRenderer = new CellEffectsRenderer(this.target, this.scene, this.mito);
    }

    if (this.target.darkness < 1) {
      this.commit();
    }
  }

  commit() {
    if (this.target instanceof Cell) {
      this.instance.commitCenter(this.target.pos.x, this.target.pos.y + this.target.droopY, 1);
    } else {
      const z = this.target instanceof Air ? -10 : 0;
      this.instance.commitCenter(this.target.pos.x, this.target.pos.y, z);
    }
    this.instance.commitTexturePosition(this.materialInfo.texturePosition);
    this.instance.commitColor(this.color);
    this.instance.commitScale(this.scale);
    this.instance.commitTileType(this.target instanceof Air ? 1 : 0);
  }

  update() {
    if (this.target.darkness < 1) {
      this.respondToEvents();

      this.updateScale();
      this.updateColor();

      this.updateInventory();
      this.maybeUpdateCellEffectsRenderer();

      this.animation.update();
      this.commit();
    }
  }

  maybeUpdateCellEffectsRenderer() {
    if (this.cellEffectsRenderer != null) {
      this.cellEffectsRenderer.update();
    }
  }

  updateInventory() {
    if (this.inventoryRenderer != null) {
      // will not render without an update
      this.inventoryRenderer.update();
    }
  }

  updateScale() {
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

  updateColor() {
    const lightAmount = this.target.lightAmount();
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
    if (this.target instanceof Cell) {
      this.color.lerp(new Color(0), 1 - this.target.energy / CELL_MAX_ENERGY);
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
        this.animation.set(this.growPulseAnimation());
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
        this.animation.set(this.growPulseAnimation());
      }
      this.lastAudioValueTracker = newAudioValueTracker;
    }
    if (this.neighborLines.parent != null) {
      this.scene.remove(this.neighborLines);
    }
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
    if (this.hasActiveNeighbors(this.target)) {
      this.scene.add(this.neighborLines);
      this.neighborLines.position.set(this.target.pos.x, this.target.pos.y, 1);
      const color = this.target instanceof Root ? new Color("rgb(9, 12, 255)").getHex() : 0xffc90e;
      const lines = this.target.activeNeighbors;
      if (lines.length !== this.neighborLines.children.length) {
        // redo neighbor lines
        this.neighborLines.remove(...this.neighborLines.children);
        lines.forEach((dir) => {
          const length = dir.length() - 0.25;
          const arrowDir = new Vector3(dir.x, dir.y, 0).normalize();
          const line = this.makeLine(arrowDir, new Vector3(), length, color);
          this.neighborLines.add(line);
        });
      }
    }
  }

  growPulseAnimation(): Animation {
    const duration = 0.5;
    const ease = reversed(easeCubic);
    return (t) => {
      const tNorm = clamp((t / duration) * ((this.target as any).tempo || 1), 0, 1);
      const scale = map(ease(tNorm), 0, 1, 1, 1.3);
      this.scale.setScalar(scale);
      return tNorm >= 1;
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
    if (this.inventoryRenderer != null) {
      this.inventoryRenderer.destroy();
    }
    if (this.cellEffectsRenderer != null) {
      this.cellEffectsRenderer.destroy();
    }
    this.scene.remove(this.neighborLines);
  }
}

interface MaterialInfo {
  /**
   * If unspecified, means white but respect transparency
   */
  color?: Color;
  texturePosition: Vector2;
}

export const materialInfoMapping = (() => {
  const materials = new Map<Constructor<Tile>, MaterialInfo>();
  materials.set(Air, {
    texturePosition: new Vector2(0, 3),
    color: new Color("white"),
  });
  const siltColor = new Color("rgb(112, 89, 44)");
  materials.set(Sand, {
    texturePosition: new Vector2(1, 0),
    color: new Color("rgb(223, 220, 231)").multiplyScalar(1 / 1.2),
  });
  materials.set(Silt, {
    texturePosition: new Vector2(1, 0),
    color: siltColor,
  });
  materials.set(Clay, {
    texturePosition: new Vector2(1, 0),
    color: siltColor.clone().multiplyScalar(1 / 1.5),
  });
  materials.set(Fountain, {
    color: new Color("white"),
    texturePosition: new Vector2(2, 0),
  });
  materials.set(Rock, {
    texturePosition: new Vector2(3, 0),
    color: new Color("rgb(63, 77, 84)"),
  });
  materials.set(DeadCell, {
    texturePosition: new Vector2(0, 1),
    color: new Color("rgb(128, 128, 128)"),
  });
  materials.set(Tissue, {
    texturePosition: new Vector2(1, 1),
    color: new Color(0x30ae25),
  });
  materials.set(Transport, materials.get(Tissue)!);
  materials.set(Leaf, {
    color: new Color("white"),
    texturePosition: new Vector2(2, 1),
  });
  materials.set(Root, {
    color: new Color("white"),
    texturePosition: new Vector2(3, 1),
  });
  materials.set(Fruit, {
    texturePosition: new Vector2(0, 2),
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

const WHITE = new Color(1, 1, 1);
