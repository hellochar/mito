import { blopBuffer, distScalar } from "game/audio";
import { GenePhotosynthesis } from "std/genes/GenePhotosynthesis";
import { Audio, Object3D, Vector2, Vector3 } from "three";
import { GeneRenderer } from "./GeneRenderer";
import makeLine from "./makeLine";
export class GenePhotosynthesisRenderer extends GeneRenderer<GenePhotosynthesis> {
  private audio = (() => {
    const audio = new Audio(this.mito.audioListener);
    blopBuffer.then((buffer) => audio.setBuffer(buffer));
    return audio;
  })();

  private lastAudioValueTracker = 0;

  private neighborLines = new Object3D();

  update() {
    // audio
    const newAudioValueTracker = this.target.state.totalSugarProduced;
    if (newAudioValueTracker > this.lastAudioValueTracker) {
      const baseVolume = this.target.state.sugarConverted * this.target.state.sugarConverted;
      const volume = distScalar(this.target.cell, this.mito.world.player) * baseVolume;
      this.audio.setVolume(volume);
      // this.audio.setRefDistance(2);
      // play blop sound
      this.audio.play();
      this.tileRenderer.animation.set(this.tileRenderer.growPulseAnimation());
    }
    this.lastAudioValueTracker = newAudioValueTracker;
    if (this.neighborLines.parent != null) {
      this.scene.remove(this.neighborLines);
    }
  }

  hover() {
    this.scene.add(this.neighborLines);
    this.neighborLines.position.set(this.tileRenderer.target.pos.x, this.tileRenderer.target.pos.y, 1);
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
    this.scene.remove(this.neighborLines);
    if (this.audio != null) {
      this.audio.disconnect();
    }
  }
}

const color = 0xffc90e;
