import Mito from "sketches/mito";
import { suckWaterBuffer } from "sketches/mito/audio";
import { Gene, GeneInstance } from "sketches/mito/game/tile/chromosome";
import { GeneSoilAbsorb } from "sketches/mito/game/tile/genes";
import { Audio, Color, Object3D, Scene, Vector2, Vector3 } from "three";
import { Renderer } from "../Renderer";
import { InstancedTileRenderer } from "./InstancedTileRenderer";
import makeLine from "./makeLine";

export abstract class GeneRenderer<G extends Gene = Gene> extends Renderer<GeneInstance<G>> {
  abstract hover(): void;
}

export class GeneSoilAbsorbRenderer extends GeneRenderer<GeneSoilAbsorb> {
  private audio = new Audio(this.mito.audioListener).setBuffer(suckWaterBuffer);
  private lastAudioValueTracker = 0;
  constructor(t: GeneInstance<GeneSoilAbsorb>, s: Scene, m: Mito, public tr: InstancedTileRenderer) {
    super(t, s, m);
  }
  update() {
    const newAudioValueTracker = this.target.state.totalSucked;
    if (newAudioValueTracker !== this.lastAudioValueTracker) {
      // const baseVolume = this.target.waterTransferAmount / (2 + this.target.waterTransferAmount);
      const baseVolume = 1;
      const dist = this.target.cell.pos.distanceToSquared(this.mito.world.player.pos);
      const volume = Math.min(1, 1 / (1 + dist / 25)) * baseVolume;
      this.audio.setVolume(volume);
      if (this.audio.source != null) {
        this.audio.stop();
      }
      this.audio.play();
      this.tr.animation.set(this.tr.growPulseAnimation());
    }
    this.lastAudioValueTracker = newAudioValueTracker;
    if (this.neighborLines.parent != null) {
      this.scene.remove(this.neighborLines);
    }
  }

  private neighborLines = new Object3D();
  hover() {
    this.scene.add(this.neighborLines);
    this.neighborLines.position.set(this.tr.target.pos.x, this.tr.target.pos.y, 1);
    const lines: Vector2[] = this.target.state.activeNeighbors;
    if (lines.length !== this.neighborLines.children.length) {
      // redo neighbor lines
      this.neighborLines.remove(...this.neighborLines.children);
      lines.forEach((dir) => {
        const length = dir.length() - 0.25;
        const arrowDir = new Vector3(dir.x, dir.y, 0).normalize();
        const line = makeLine(arrowDir, new Vector3(), length, color);
        this.neighborLines.add(line);
      });
    }
  }

  destroy() {
    this.audio.disconnect();
  }
}

const color = new Color("rgb(9, 12, 255)").getHex();
