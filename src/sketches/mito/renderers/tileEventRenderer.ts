import { Color } from "three";
import { EventCellEat, EventCellTransferEnergy, EventEvaporation, TileEvent, TileEventType } from "../game/tileEvent";
import { textureFromSpritesheet } from "../spritesheet";
import { FireAndForgetPoints } from "./fireAndForgetPoints";
import { InventoryRenderer } from "./InventoryRenderer";
import { Renderer } from "./Renderer";
import { InstancedTileRenderer } from "./tile/InstancedTileRenderer";
import { WorldRenderer } from "./WorldRenderer";

class SingleTileEventRenderer<T extends TileEvent> extends Renderer<T[]> {
  constructor(
    public eventName: T["type"],
    public worldRenderer: WorldRenderer,
    public ffPoints: FireAndForgetPoints<T>,
    public handle: (renderer: SingleTileEventRenderer<T>, event: T) => void
  ) {
    super([], worldRenderer.scene, worldRenderer.mito);
    this.scene.add(this.ffPoints);
  }

  update() {
    this.target = this.worldRenderer.target.getLastStepStats().events[this.eventName] as T[];
    this.ffPoints.update(1 / 30);
    for (const event of this.target) {
      this.handle(this, event);
    }
    this.ffPoints.commitAll();
  }

  destroy() {
    this.scene.remove(this.ffPoints);
  }
}

export class EventLogRenderer extends Renderer<WorldRenderer> {
  private singleEventRenderers = {
    "cell-eat": new SingleTileEventRenderer("cell-eat", this.target, makeCellEatFFPoints(), handleCellEatEvent),
    "cell-transfer-energy": new SingleTileEventRenderer(
      "cell-transfer-energy",
      this.target,
      makeEnergyTransferPoints(),
      handleEnergyTransferEvent
    ),
    evaporation: new SingleTileEventRenderer(
      "evaporation",
      this.target,
      makeEvaporationPoints(),
      handleEvaporationEvent
    ),
  } as const;

  constructor(worldRenderer: WorldRenderer) {
    super(worldRenderer, worldRenderer.scene, worldRenderer.mito);
  }

  update() {
    const events = this.target.target.getLastStepStats().events;
    let eventName: TileEventType;
    for (eventName in events) {
      const renderer = this.singleEventRenderers[eventName];
      if (renderer != null) {
        renderer.update();
      }
    }
  }

  destroy() {
    for (const renderer of Object.values(this.singleEventRenderers)) {
      if (renderer != null) {
        renderer.destroy();
      }
    }
  }
}

function makeCellEatFFPoints() {
  const duration = 0.3;
  return new FireAndForgetPoints(
    (s) => {
      if (s.time > duration) {
        return false;
      }
      const x = s.time / duration;
      s.size = 4 * (x - x * x);
    },
    {
      color: new Color("yellow"),
      opacity: 0.8,
      size: 200,
      map: textureFromSpritesheet(1, 3, "transparent"),
    }
  );
}

function handleCellEatEvent(renderer: SingleTileEventRenderer<EventCellEat>, event: EventCellEat) {
  const { who } = event;
  const tileRenderer = renderer.worldRenderer.renderers.get(who) as InstancedTileRenderer | null;
  const activeSugar = tileRenderer && tileRenderer.inventoryRenderer.getActiveSugar();
  const dX = (activeSugar && activeSugar.x) || 0;
  const dY = (activeSugar && activeSugar.y) || 0;
  renderer.ffPoints.fire({
    x: who.pos.x + dX,
    y: who.pos.y + dY,
    z: 1,
    size: 1,
    alpha: 1,
    info: event,
    time: 0,
  });
}

function makeEnergyTransferPoints() {
  const duration = 0.5;
  return new FireAndForgetPoints<EventCellTransferEnergy>(
    (s) => {
      if (s.time > duration) {
        return false;
      }
      const t = s.time / duration;
      const size = 4 * (t - t * t);

      const { from, to } = s.info;
      // const { x, y } = s.info.from.pos.clone().lerp(s.info.to.pos, map(t, 0, 1, 0.4, 0.6));
      const x = (from.pos.x + to.pos.x) / 2;
      const y = (from.pos.y + to.pos.y) / 2;
      const r = Math.atan2(to.pos.y - from.pos.y, to.pos.x - from.pos.x);
      s.x = x;
      s.y = y;
      s.r = r;
      s.size = size;
    },
    {
      color: new Color("yellow"),
      opacity: 0.8,
      size: 200,
      map: textureFromSpritesheet(2, 3, "transparent"),
    }
  );
}

function handleEnergyTransferEvent(
  renderer: SingleTileEventRenderer<EventCellTransferEnergy>,
  event: EventCellTransferEnergy
) {
  renderer.ffPoints.fire({
    x: event.from.pos.x,
    y: event.from.pos.y,
    z: 1,
    size: 1,
    alpha: 1,
    info: event,
    time: 0,
  });
}

function makeEvaporationPoints() {
  const duration = 1.5;
  return new FireAndForgetPoints<EventEvaporation>(
    (s) => {
      if (s.time > duration) {
        return false;
      }
      const t = s.time / duration;
      const size = 1 + t;
      const alpha = 1 - t;

      s.x += Math.sin(t * 12) * 0.01;
      s.y -= 0.01;
      s.alpha = alpha;
      s.size = size;
    },
    { ...InventoryRenderer.WaterParticles().params }
  );
}

function handleEvaporationEvent(renderer: SingleTileEventRenderer<EventEvaporation>, event: EventEvaporation) {
  if (event.tile.darkness >= 1) {
    return;
  }
  const tileRenderer = renderer.worldRenderer.renderers.get(event.tile) as InstancedTileRenderer | null;
  const stableWater = tileRenderer && tileRenderer.inventoryRenderer.getStableWater();
  const dX = (stableWater && stableWater.x) || 0;
  const dY = (stableWater && stableWater.y) || 0;
  renderer.ffPoints.fire({
    x: event.tile.pos.x + dX,
    y: event.tile.pos.y + dY,
    z: 1,
    size: 1,
    alpha: 1,
    info: event,
    time: 0,
  });
}
