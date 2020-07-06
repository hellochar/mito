import { arrayProxy } from "common/arrayProxy";
import { GeneInstance } from "core/cell/geneInstance";
import { Temperature } from "core/temperature";
import { Air, Cell, DeadCell, Fountain, GrowingCell, Rock, Tile } from "core/tile";
import { BarrenLand } from "core/tile/BarrenLand";
import { Clay, Sand, Silt } from "core/tile/soil";
import { easeCubic } from "d3-ease";
import { scaleLinear } from "d3-scale";
import Mito from "game/mito/mito";
import { params } from "game/params";
import { clamp, lerp, lerp2, map } from "math";
import { reversed } from "math/easing";
import { GeneFruit, GenePhotosynthesis, GenePipes, GeneSeed, GeneSoilAbsorption, GeneTransport } from "std/genes";
import { Color, Scene, Vector2, Vector3 } from "three";
import { Constructor } from "typings/constructor";
import { MaterialInfo } from "../../../core/cell/materialInfo";
import { InventoryRenderer } from "../InventoryRenderer";
import { Renderer } from "../Renderer";
import { WorldRenderer } from "../WorldRenderer";
import { Animation, AnimationController } from "./Animation";
import { CellEffectsRenderer } from "./CellEffectsRenderer";
import { GenePhotosynthesisRenderer } from "./GenePhotosynthesisRenderer";
import { GenePipesRenderer } from "./GenePipesRenderer";
import { GeneRenderer } from "./GeneRenderer";
import { GeneReproducerRenderer } from "./GeneReproducerRenderer";
import { GeneSoilAbsorptionRenderer } from "./GeneSoilAbsorptionRenderer";
import { GeneTransportRenderer } from "./GeneTransportRenderer";
import TileBatcher, { BatchInstance } from "./tileBatcher";

export class InstancedTileRenderer<T extends Tile = Tile> extends Renderer<T> {
  public static readonly TEMPERATURE_COLORS = {
    [Temperature.Scorching]: new Color("orange"),
    [Temperature.Hot]: new Color("orange").lerp(new Color("white"), 0.5),
    [Temperature.Mild]: new Color("white"),
    [Temperature.Cold]: new Color("lightblue"), //.lerp(new Color("white"), 0.5),
    [Temperature.Freezing]: new Color("rgb(43, 34, 126)"),
  } as Record<Temperature, Color>;

  private static readonly ONE = Object.freeze(new Vector2(1, 1));

  public inventoryRenderer?: InventoryRenderer;

  private originalColor: Color;

  private cellEffectsRenderer?: CellEffectsRenderer;

  private geneRenderer?: GeneRenderer;

  animation = new AnimationController();

  scale = new Vector3(1, 1, 1);

  private color = new Color();

  private instance: BatchInstance;

  worldRenderer: WorldRenderer;

  get materialInfo() {
    return getMaterialInfo(this.target);
  }

  constructor(target: T, scene: Scene, mito: Mito, batchMesh: TileBatcher, worldRenderer: WorldRenderer) {
    super(target, scene, mito);
    this.worldRenderer = worldRenderer;
    this.instance = batchMesh.getBatchInstance(target);
    if (this.target instanceof GrowingCell) {
      this.scale.set(0.01, 0.01, 1);
    }

    this.originalColor = (this.materialInfo.color || WHITE).clone();
    if (worldRenderer.inventoryPoints) {
      this.inventoryRenderer = new InventoryRenderer(
        this.target.inventory,
        this.scene,
        this.mito,
        worldRenderer.inventoryPoints
      );
      this.inventoryRenderer.animationOffset = (this.target.pos.x + this.target.pos.y) / 2;
    }
    if (Cell.is(this.target)) {
      // if it takes no time to build, and it was just built, start it off small just for show
      if (this.target.timeToBuild <= 0 && worldRenderer.renderResources && this.target.age < 0.1) {
        this.scale.set(0.01, 0.01, 1);
      }
      this.cellEffectsRenderer = new CellEffectsRenderer(this.target, this.scene, this.mito);
      this.geneRenderer = arrayProxy(
        this.target.geneInstances.map((g) => this.createGeneRendererFor(g)!).filter((g) => g != null)
      );
    }

    if (this.getLightAmount() > 0) {
      this.commit();
    } else {
      this.commitBlack();
    }
  }

  public getLightAmount() {
    if (params.debugLevel) {
      return 1;
    }
    return this.target.lightAmount();
  }

  private createGeneRendererFor(inst: GeneInstance<any>): GeneRenderer<any> | undefined {
    if (inst.isType(GeneSoilAbsorption)) {
      return new GeneSoilAbsorptionRenderer(inst, this);
    } else if (inst.isType(GenePhotosynthesis)) {
      return new GenePhotosynthesisRenderer(inst, this);
    } else if (inst.isType(GeneTransport)) {
      return new GeneTransportRenderer(inst, this);
    } else if (inst.isType(GeneFruit) || inst.isType(GeneSeed)) {
      return new GeneReproducerRenderer(inst, this);
    } else if (inst.isType(GenePipes)) {
      return new GenePipesRenderer(inst, this);
    } else {
      return;
    }
  }

  commit() {
    if (this.target instanceof GrowingCell) {
      const { start, pos } = this.target;
      const p = start.clone().lerp(pos, 0.5);
      const t1Pos = pos;
      const t = this.scale.x;
      lerp2(p, t1Pos, t);
      this.instance.commitCenter(p.x, p.y, 1);
    } else if (Cell.is(this.target)) {
      this.instance.commitCenter(this.target.pos.x, this.target.pos.y + this.target.droopY, 1);
    } else {
      const z = Air.is(this.target) ? -10 : 0;
      this.instance.commitCenter(this.target.pos.x, this.target.pos.y, z);
    }
    this.instance.commitTexturePosition(this.materialInfo.texturePosition);
    this.instance.commitColor(this.color.r, this.color.g, this.color.b);
    this.instance.commitTemperature(this.target.temperatureFloat);
    // const dist = this.target.pos.distanceTo(this.mito.world.player.pos);
    // const timeAlive = this.target.age;
    // const alpha = clamp(easeCubicIn(timeAlive * 3 - dist), 0, 1);
    // this.instance.commitAlpha(alpha);
    this.instance.commitScale(this.scale);
  }

  commitBlack() {
    this.instance.commitTexturePosition(this.materialInfo.texturePosition);
    this.instance.commitTemperature(this.target.temperatureFloat);
    this.instance.commitColor(0, 0, 0);
    this.instance.commitCenter(this.target.pos.x, this.target.pos.y, 10);
    this.instance.commitScale(this.scale);
  }

  update() {
    if (this.getLightAmount() > 0) {
      this.updateScale();
      this.updateColor();

      this.updateInventory();
      this.maybeUpdateCellEffectsRenderer();

      if (this.geneRenderer) {
        this.geneRenderer.update();
      }

      if (this.worldRenderer.renderResources) {
        this.animation.update();
      }
      this.commit();
    } else {
      this.commitBlack();
    }
  }

  maybeUpdateCellEffectsRenderer() {
    if (this.cellEffectsRenderer != null) {
      this.cellEffectsRenderer.update();
    }
  }

  updateInventory() {
    // will not render without an update
    this.inventoryRenderer?.update();
  }

  updateScale() {
    if (this.target instanceof GrowingCell) {
      const s = map(this.target.percentGrown, 0, 1, 0.1, 1);
      lerp2(this.scale, { x: s, y: s }, 0.5);
    } else if (Cell.is(this.target) && this.target.isReproductive) {
      // Do nothing; GeneRenderer sets scale for you
    } else {
      lerp2(this.scale, InstancedTileRenderer.ONE, 0.25);
    }
  }

  updateColor() {
    const lightAmount = this.getLightAmount();
    if (Air.is(this.target)) {
      const co2Color = getCo2Color(this.target.co2());
      this.originalColor.copy(co2Color);
    }
    this.color.copy(this.originalColor);
    if (Cell.is(this.target) && this.target.energy < 0.5) {
      const amountBlack = map(this.target.energy, 0, 0.5, 1, 0);
      this.color.lerp(BLACK, amountBlack);
    }

    this.lerpColorTemperature(this.color);
    // darkness overlay
    this.color.lerp(BLACK, map(lightAmount, 0, 1, 0.8, 0));
  }

  private temperatureColor: Color = InstancedTileRenderer.TEMPERATURE_COLORS[Temperature.Mild];

  private currentLerp = 0;

  private lerpColorTemperature(color: Color) {
    const { temperature } = this.target;
    let tColor = InstancedTileRenderer.TEMPERATURE_COLORS[temperature];
    if (tColor !== this.temperatureColor) {
      this.currentLerp = 0;
    }
    const targetLerp = temperature === Temperature.Mild ? 0 : 0.25;
    this.temperatureColor = tColor;
    this.currentLerp = lerp(this.currentLerp, targetLerp, 0.1);
    color.lerp(this.temperatureColor, this.currentLerp);
  }

  updateHover() {
    this.geneRenderer?.hover?.();
  }

  growPulseAnimation(): Animation {
    const duration = 0.5 * (Cell.is(this.target) ? this.target.tempo : 1);
    const ease = reversed(easeCubic);
    return (t) => {
      const tNorm = clamp(t / duration, 0, 1);
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

  destroy() {
    this.instance.destroy();
    // this.scene.remove(this.mesh);
    this.inventoryRenderer?.destroy();
    this.cellEffectsRenderer?.destroy();
    this.geneRenderer?.destroy();
  }
}

const materialInfoMapping = (() => {
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
  materials.set(BarrenLand, {
    texturePosition: new Vector2(4, 0),
    color: new Color("rgb(193, 159, 92)"),
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
  return materials;
})();

export function getMaterialInfo(tile: Tile): MaterialInfo {
  if (tile instanceof GrowingCell) {
    return getMaterialInfo(tile.completedCell);
  } else if (Cell.is(tile)) {
    return tile.type.material;
  } else {
    return materialInfoMapping.get(tile.constructor as Constructor<Tile>)!;
  }
}

const getCo2Color = (() => {
  const CO2_COLORSCALE = scaleLinear<string, string>()
    .domain([0.25, 0.5, 1])
    .range(["hsl(51, 32%, 28%)", "hsl(180, 31%, 76%)", "hsl(213, 83%, 48%)"]);
  const cache: Color[] = [];
  const NUM_STEPS = 200;
  for (let i = 0; i <= NUM_STEPS; i++) {
    // creating threejs colors from the d3 colorscale is expensive! cache it once
    cache[i] = new Color(CO2_COLORSCALE(i / NUM_STEPS));
  }
  return (co2: number) => {
    return cache[Math.floor(co2 * NUM_STEPS)];
  };
})();

const WHITE = new Color(1, 1, 1);
const BLACK = new Color(0, 0, 0);
