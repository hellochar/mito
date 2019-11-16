import { createSelector } from "reselect";
import { Scene } from "three";
import Mito from "..";
import { Entity, Player, StepStats, World } from "../game";
import { Tile, Transport } from "../game/tile";
import { InventoryRenderer } from "./InventoryRenderer";
import { PlayerRenderer } from "./PlayerRenderer";
import { Renderer } from "./Renderer";
import { InstancedTileRenderer } from "./tile/InstancedTileRenderer";
import TileBatcher from "./tile/tileBatcher";
import { TransportRenderer } from "./tile/TransportRenderer";

export class WorldRenderer extends Renderer<World> {
  public renderers = new Map<Entity, Renderer<Entity>>();
  public readonly tileBatcher: TileBatcher;

  constructor(target: World, scene: Scene, mito: Mito, renderResources = true) {
    super(target, scene, mito);
    if (renderResources) {
      scene.add(InventoryRenderer.WaterParticles());
      scene.add(InventoryRenderer.SugarParticles());
    }
    this.tileBatcher = new TileBatcher(this.target);
    scene.add(this.tileBatcher.mesh);
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
  }

  destroy(): void {
    throw new Error("Method not implemented.");
  }
}
