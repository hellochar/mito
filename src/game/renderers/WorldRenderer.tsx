import { createSelector } from "reselect";
import { Scene } from "three";
import { Entity, Player, PlayerSeed, StepStats, World } from "../../core";
import { Tile } from "../../core/tile";
import Mito from "../mito/mito";
import { EventLogRenderer } from "./events/eventLogRenderer";
import { InventoryRenderer } from "./InventoryRenderer";
import { PlayerRenderer } from "./PlayerRenderer";
import { PlayerSeedRenderer } from "./PlayerSeedRenderer";
import { Renderer } from "./Renderer";
import { InstancedTileRenderer } from "./tile/InstancedTileRenderer";
import TileBatcher from "./tile/tileBatcher";

export class WorldRenderer extends Renderer<World> {
  public renderers = new Map<Entity, Renderer<Entity>>();

  public readonly tileBatcher: TileBatcher;

  // private lightEmitter: LightEmitter;
  public eventLogRenderer?: EventLogRenderer;

  constructor(target: World, scene: Scene, mito: Mito, public renderResources = true) {
    super(target, scene, mito);

    // must be added before all particles
    this.tileBatcher = new TileBatcher(this.target);
    scene.add(this.tileBatcher.mesh);

    if (renderResources) {
      scene.add(InventoryRenderer.WaterParticles());
      scene.add(InventoryRenderer.SugarParticles());
      this.eventLogRenderer = new EventLogRenderer(this);
    }
    // this.lightEmitter = new LightEmitter(this);
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
    } else if (object instanceof PlayerSeed) {
      return new PlayerSeedRenderer(object, this.scene, this.mito);
    } else if (object instanceof Tile) {
      return new InstancedTileRenderer(object, this.scene, this.mito, this.tileBatcher, this);
    } else {
      console.error(`Couldn't find renderer for`, object);
      return null!;
    }
  }

  private deleteDeadEntityRenderers = createSelector(
    (stats: StepStats) => stats,
    (stats) => {
      const deletedEntities = stats.deleted;

      for (const e of deletedEntities) {
        const renderer = this.renderers.get(e);
        if (renderer == null) {
          console.warn(`Couldn't find renderer for ${e}!`);
          continue;
        }
        renderer.destroy();
        this.renderers.delete(e);
      }
    }
  );

  update(): void {
    this.deleteDeadEntityRenderers(this.target.getLastStepStats());
    // this.lightEmitter.update(1 / 30);

    // careful - event log renderers rely on state from other renderers (e.g. position
    // of water particle as it's evaporating) that requires it to update before others
    if (this.eventLogRenderer) {
      this.eventLogRenderer.update();
    }

    InventoryRenderer.startFrame();
    this.target.entities().forEach((entity) => {
      const renderer = this.getOrCreateRenderer(entity);
      renderer.update();
    });
    InventoryRenderer.endFrame();
    this.tileBatcher.endFrame();
  }

  destroy(): void {
    throw new Error("Method not implemented.");
  }
}
