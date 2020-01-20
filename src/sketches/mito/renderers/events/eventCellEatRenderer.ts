import { distScalar, eatBuffer } from "sketches/mito/audio";
import { EventCellEat } from "sketches/mito/game/tileEvent";
import { textureFromSpritesheet } from "sketches/mito/spritesheet";
import { Audio, Color } from "three";
import { FireAndForgetPoints } from "../fireAndForgetPoints";
import { InstancedTileRenderer } from "../tile/InstancedTileRenderer";
import { WorldRenderer } from "../WorldRenderer";
import { EventRendererFFPoints } from "./eventRendererFFPoints";

export default class EventCellEatRenderer extends EventRendererFFPoints<EventCellEat> {
  static makePoints() {
    const duration = 0.6;
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

  constructor(target: WorldRenderer) {
    super("cell-eat", target, EventCellEatRenderer.makePoints());
  }

  private audio = (() => {
    const audio = new Audio(this.mito.audioListener);
    audio.loop = true;
    audio.setVolume(0);
    eatBuffer.then((buffer) => {
      audio.setBuffer(buffer);
      audio.play();
    });
    return audio;
  })();

  handle(event: EventCellEat) {
    const { who } = event;
    const baseVolume = 0.75;
    const volume = distScalar(who, this.mito.world.player) * baseVolume;
    if (volume > this.audio.gain.gain.value) {
      this.audio.gain.gain.setValueAtTime(volume, 0);
      this.audio.gain.gain.cancelScheduledValues(this.audio.context.currentTime + 1);
      this.audio.gain.gain.setTargetAtTime(0, this.audio.context.currentTime + 1, 0.1);
    }
    const tileRenderer = this.worldRenderer.renderers.get(who) as InstancedTileRenderer | null;
    const activeSugar = tileRenderer && tileRenderer.inventoryRenderer.getActiveSugar();
    const dX = (activeSugar && activeSugar.x) || 0;
    const dY = (activeSugar && activeSugar.y) || 0;
    this.ffPoints.fire({
      x: who.pos.x + dX,
      y: who.pos.y + dY,
      z: 1,
      size: 1,
      alpha: 1,
      info: event,
      time: 0,
    });
  }
}
