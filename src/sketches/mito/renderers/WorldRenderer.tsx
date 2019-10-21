import { Scene } from "three";
import { createSelector } from "reselect";

import { Renderer } from "./Renderer";
import { World, Entity, Player, StepStats } from "../game";
import Mito from "..";
import { PlayerRenderer } from "./PlayerRenderer";
import { Transport, Tile } from "../game/tile";
import { TransportRenderer } from "./TransportRenderer";
import { TileRenderer } from "./TileRenderer";
import { InventoryRenderer } from "./InventoryRenderer";

export function createRendererFor<E extends Entity>(object: E, scene: Scene, mito: Mito): Renderer<Entity> {
  if (object instanceof Player) {
    return new PlayerRenderer(object, scene, mito);
  } else if (object instanceof Transport) {
    return new TransportRenderer(object, scene, mito);
  } else if (object instanceof Tile) {
    return new TileRenderer(object, scene, mito);
  } else {
    throw new Error(`Couldn't find renderer for ${object}`);
  }
}

export class WorldRenderer extends Renderer<World> {
  public renderers = new Map<Entity, Renderer<Entity>>();
  constructor(target: World, scene: Scene, mito: Mito) {
    super(target, scene, mito);
    scene.add(InventoryRenderer.WaterParticles());
    scene.add(InventoryRenderer.SugarParticles());
  }

  public getOrCreateRenderer(entity: Entity) {
    const renderer = this.renderers.get(entity);
    if (renderer == null) {
      const created = createRendererFor(entity, this.scene, this.mito);
      this.renderers.set(entity, created);
      return created;
    } else {
      return renderer;
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
  }
  destroy(): void {
    throw new Error("Method not implemented.");
  }
}
