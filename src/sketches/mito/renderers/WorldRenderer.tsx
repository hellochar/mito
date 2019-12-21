import { createSelector } from "reselect";
import { Color, Scene } from "three";
import Mito from "..";
import { Entity, Player, StepStats, World } from "../game";
import { Tile, Transport } from "../game/tile";
import { textureFromSpritesheet } from "../spritesheet";
import { FireAndForgetPoints } from "./fireAndForgetPoints";
import { InventoryRenderer } from "./InventoryRenderer";
import { PlayerRenderer } from "./PlayerRenderer";
import { Renderer } from "./Renderer";
import { InstancedTileRenderer } from "./tile/InstancedTileRenderer";
import TileBatcher from "./tile/tileBatcher";
import { TransportRenderer } from "./tile/TransportRenderer";

function makeEatIndicatorPoints() {
  const duration = 0.3;
  return new FireAndForgetPoints(
    (s) => {
      if (s.time > duration) {
        return false;
      }
      const x = s.time / duration;
      const size = 4 * (x - x * x);
      return {
        ...s,
        // size: (1 - s.time / 0.5) ** (1 / 8),
        size,
      };
    },
    {
      color: new Color("yellow"),
      opacity: 0.8,
      size: 200,
      map: textureFromSpritesheet(1, 3, "transparent"),
    }
  );
}

export class WorldRenderer extends Renderer<World> {
  public renderers = new Map<Entity, Renderer<Entity>>();
  public readonly tileBatcher: TileBatcher;
  // private lightRays: LightRays;
  public eatIndicatorPoints?: FireAndForgetPoints;

  constructor(target: World, scene: Scene, mito: Mito, renderResources = true) {
    super(target, scene, mito);
    if (renderResources) {
      scene.add(InventoryRenderer.WaterParticles());
      scene.add(InventoryRenderer.SugarParticles());
      this.eatIndicatorPoints = makeEatIndicatorPoints();
      scene.add(this.eatIndicatorPoints);
    }
    this.tileBatcher = new TileBatcher(this.target);
    scene.add(this.tileBatcher.mesh);

    // this.lightRays = new LightRays(this.target);
    // scene.add(this.lightRays.lineSegments);

    // scene.add(new PlaneHelper(this.lightRays.planeTop, 25));
    // scene.add(new PlaneHelper(this.lightRays.planeLeft, 25));
    // scene.add(new PlaneHelper(this.lightRays.planeBottom, 25));
    // scene.add(new PlaneHelper(this.lightRays.planeRight, 25));
  }

  public getOrCreateRenderer(entity: Entity) {
    const renderer = this.renderers.get(entity);
    if (renderer == null) {
      const created = this.createRendererFor(entity);
      this.renderers.set(entity, created);
      return created;
    } else {
      return renderer;
    }
  }

  public createRendererFor<E extends Entity>(object: E): Renderer<Entity> {
    if (object instanceof Player) {
      return new PlayerRenderer(object, this.scene, this.mito);
    } else if (object instanceof Transport) {
      return new TransportRenderer(object, this.scene, this.mito, this.tileBatcher);
    } else if (object instanceof Tile) {
      //  return new TileRenderer(object, this.scene, this.mito);
      return new InstancedTileRenderer(object, this.scene, this.mito, this.tileBatcher);
    } else {
      throw new Error(`Couldn't find renderer for ${object}`);
    }
  }

  private deleteDeadEntityRenderers = createSelector(
    (stats: StepStats) => stats,
    (stats) => {
      const deletedEntities = stats.deleted;

      for (const e of deletedEntities) {
        const renderer = this.renderers.get(e);
        if (renderer == null) {
          throw new Error(`Couldn't find renderer for ${e}!`);
        }
        renderer.destroy();
        this.renderers.delete(e);
      }
    }
  );

  update(): void {
    this.deleteDeadEntityRenderers(this.target.getLastStepStats());

    InventoryRenderer.startFrame();
    this.target.entities().forEach((entity) => {
      const renderer = this.getOrCreateRenderer(entity);
      renderer.update();
    });
    InventoryRenderer.endFrame();
    this.tileBatcher.endFrame();

    if (this.eatIndicatorPoints != null) {
      this.eatIndicatorPoints.update(1 / 30);
      for (const { tile } of this.target.getLastStepStats().events) {
        const tileRenderer = this.renderers.get(tile) as InstancedTileRenderer;
        const sugars = tileRenderer.inventoryRenderer.sugars;
        const lastSugar = sugars[sugars.length - 1];
        const dX = (lastSugar && lastSugar.x) || 0;
        const dY = (lastSugar && lastSugar.y) || 0;
        this.eatIndicatorPoints.fire(tile.pos.x + dX, tile.pos.y + dY, 1, 1);
      }
      this.eatIndicatorPoints.commitAll();
    }

    // this.lightRays.update(1 / 30);
  }

  destroy(): void {
    throw new Error("Method not implemented.");
  }
}
