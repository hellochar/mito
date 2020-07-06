import snowUrl from "assets/images/snow.png";
import { Insect } from "core/insect";
import { createSelector } from "reselect";
import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  Texture,
  TextureLoader,
  Vector2,
} from "three";
import { Entity, Player, PlayerSeed, StepStats, World } from "../../core";
import { Tile } from "../../core/tile";
import Mito from "../mito/mito";
import { EventLogRenderer } from "./events/eventLogRenderer";
import { InsectRenderer } from "./InsectRenderer";
import { InventoryPoints } from "./InventoryRenderer";
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

  public inventoryPoints?: InventoryPoints;

  snowMesh: Mesh;

  snowMap: Texture;

  constructor(target: World, scene: Scene, mito: Mito, public renderResources = true) {
    super(target, scene, mito);

    // must be added before all particles
    this.tileBatcher = new TileBatcher(this.target);
    scene.add(this.tileBatcher.mesh);

    this.inventoryPoints = new InventoryPoints();
    scene.add(this.inventoryPoints.waters);
    scene.add(this.inventoryPoints.sugars);
    this.eventLogRenderer = new EventLogRenderer(this);
    if (renderResources) {
    }
    const snowGeometry = new PlaneGeometry(50, 100);
    this.snowMap = new TextureLoader().load(snowUrl, (texture) => {
      texture.magFilter = texture.minFilter = NearestFilter;
      texture.flipY = true;
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat = new Vector2(5, 10);
    });
    const snowMaterial = new MeshBasicMaterial({
      map: this.snowMap,
      color: new Color(1, 1, 1),
      transparent: true,
      // alphaTest: 0.3,
      opacity: 0.3,
      side: DoubleSide,
    });
    this.snowMesh = new Mesh(snowGeometry, snowMaterial);
    this.snowMesh.position.set(25, 50, -9);
    this.snowMesh.renderOrder = 1;
    scene.add(this.snowMesh);
    // this.lightEmitter = new LightEmitter(this);
  }

  public getOrCreateRenderer(entity: Entity) {
    const renderer = this.renderers.get(entity);
    if (renderer == null) {
      const created = this.createRendererFor(entity);
      if (created) {
        this.renderers.set(entity, created);
        return created;
      }
    } else {
      return renderer;
    }
  }

  public createRendererFor<E extends Entity>(object: E): Renderer<Entity> | null {
    if (object instanceof Player) {
      return new PlayerRenderer(object, this.scene, this.mito);
    } else if (object instanceof PlayerSeed) {
      return new PlayerSeedRenderer(object, this.scene, this.mito);
    } else if (object instanceof Tile) {
      return new InstancedTileRenderer(object, this.scene, this.mito, this.tileBatcher, this);
    } else if (object instanceof Insect) {
      return new InsectRenderer(object, this.scene, this.mito);
    } else {
      console.error(`Couldn't find renderer for`, object);
      return null;
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
    this.snowMap.offset.x -= 0.0001;
    this.snowMap.offset.y -= 0.0005;

    // careful - event log renderers rely on state from other renderers (e.g. position
    // of water particle as it's evaporating) that requires it to update before others
    if (this.eventLogRenderer) {
      this.eventLogRenderer.update();
    }

    this.inventoryPoints?.startFrame();
    const entities = this.target.entities();
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      const renderer = this.getOrCreateRenderer(entity);
      renderer?.update();
    }
    this.inventoryPoints?.endFrame();
    this.tileBatcher.endFrame();
  }

  destroy(): void {
    throw new Error("Method not implemented.");
  }
}
