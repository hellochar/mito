import { GeneInstance } from "core/cell";
import { easeCubicOut, easeExpOut } from "d3-ease";
import { clickGeneric, playSmallRand } from "game/audio";
import Keyboard from "game/input/keyboard";
import { WorldDOMElement } from "game/mito/WorldDOMElement";
import { randFloat, roundToNearest } from "math";
import React, { useCallback, useEffect, useState } from "react";
import { GeneTransport } from "std/genes/GeneTransport";
import { ArrowHelper, Vector2, Vector3 } from "three";
import { Animation } from "./Animation";
import { GeneRenderer } from "./GeneRenderer";
import "./GeneTransportRenderer.scss";

export class GeneTransportRenderer extends GeneRenderer<GeneTransport> {
  private arrow!: ArrowHelper;

  private origin!: Vector2;

  private lastDir = new Vector2(0, 0);

  private argsEditor?: WorldDOMElement;

  update() {
    this.updateArrow();
    this.updateArrowPosition();
    if (this.tileRenderer.worldRenderer.renderResources) {
      this.updateArgsEditor();
    }

    if (this.target.state.didJustTransport) {
      this.tileRenderer.animation.set(this.arrowMoveAnimation());
    }
  }

  updateArgsEditor() {
    const shouldShowArgsEditor = Keyboard.keyMap.has("ShiftLeft") && this.mito.getTileAtScreen() === this.target.cell;
    if (shouldShowArgsEditor && this.argsEditor == null) {
      this.argsEditor = this.mito.addWorldDOMElement(this.positionFn, this.renderFn);
    } else if (!shouldShowArgsEditor && this.argsEditor != null) {
      this.mito.removeWorldDOMElement(this.argsEditor);
      this.argsEditor = undefined;
    }
  }

  private positionFn = () => this.target.cell;

  private renderFn = () => {
    return <TransportEditor gene={this.target} />;
  };

  updateArrow() {
    const dir = this.target.cell.args!.direction!;
    if (!dir.equals(this.lastDir)) {
      if (this.arrow != null) {
        this.arrow.parent!.remove(this.arrow);
      }
      // const length = target.dir.length() - 0.25;
      const length = 0.5;
      const arrowDir = dir.clone().normalize();
      this.origin = arrowDir.clone().multiplyScalar(-length / 2);
      this.arrow = new ArrowHelper(
        new Vector3(arrowDir.x, arrowDir.y, 0),
        new Vector3(this.origin.x, this.origin.y, 2),
        length,
        0xffffff,
        0.1,
        0.1
      );
      this.scene.add(this.arrow);
      this.lastDir.copy(dir);
      this.tileRenderer.animation.set(this.arrowSetAnimation());
    }
  }

  updateArrowPosition({ x, y }: { x: number; y: number } = this.origin) {
    this.arrow.position.set(this.target.cell.pos.x + x, this.target.cell.pos.y + this.target.cell.droopY + y, 2);
  }

  arrowMoveAnimation(): Animation {
    const duration = 0.25;
    const len = this.origin.length();
    const start = this.origin.clone().setLength(len * 1.1);
    const target = this.origin.clone().setLength(len * 0.5);
    return (t) => {
      const tNorm = t / duration;
      this.updateArrowPosition(start.clone().lerp(target, easeExpOut(tNorm)));
      return tNorm >= 1;
    };
  }

  arrowSetAnimation(): Animation {
    const duration = 0.2;
    return (t) => {
      const tNorm = t / duration;
      const vibrationAmount = easeCubicOut(1 - tNorm) * 0.1;
      this.updateArrowPosition({
        x: randFloat(-vibrationAmount, vibrationAmount),
        y: randFloat(-vibrationAmount, vibrationAmount),
      });
      // const scale = clamp(map(tNorm, 0, 1, 2, 1), 1, 2);
      // this.arrow.scale.set(scale, scale, 1);
      return tNorm >= 1;
    };
  }

  hover() {}

  destroy() {
    this.scene.remove(this.arrow);
    if (this.argsEditor) {
      this.mito.removeWorldDOMElement(this.argsEditor);
    }
  }
}

const TransportEditor: React.FC<{ gene: GeneInstance<GeneTransport> }> = ({ gene }) => {
  const setDirN = useCallback(() => {
    gene.cell.args?.direction?.set(0, -1);
    playSmallRand(clickGeneric);
  }, [gene.cell.args]);

  const setDirS = useCallback(() => {
    gene.cell.args?.direction?.set(0, 1);
    playSmallRand(clickGeneric);
  }, [gene.cell.args]);

  const setDirE = useCallback(() => {
    gene.cell.args?.direction?.set(1, 0);
    playSmallRand(clickGeneric);
  }, [gene.cell.args]);

  const setDirW = useCallback(() => {
    gene.cell.args?.direction?.set(-1, 0);
    playSmallRand(clickGeneric);
  }, [gene.cell.args]);

  const [wantedDirection, addEvent] = useWantedDirection();
  useEffect(() => {
    if (wantedDirection) {
      if (!gene.cell.args?.direction?.equals(wantedDirection)) {
        gene.cell.args?.direction?.copy(wantedDirection);
        playSmallRand(clickGeneric);
      }
    }
  }, [gene.cell.args, wantedDirection]);
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (event.buttons !== 0) {
        addEvent(event);
      }
    },
    [addEvent]
  );

  return (
    <div className="directional-push-editor" onMouseMove={handleMouseMove}>
      <div className="zone-n" onClick={setDirN}></div>
      <div className="zone-w" onClick={setDirW}></div>
      <div className="zone-center" />
      <div className="zone-e" onClick={setDirE}></div>
      <div className="zone-s" onClick={setDirS}></div>
    </div>
  );
};

function useWantedDirection() {
  const [latestMovements, setLatestMovements] = useState<Vector2[]>([]);

  const addEvent = useCallback((event: React.MouseEvent) => {
    const { movementX, movementY } = event;
    const movement = new Vector2(movementX, movementY);
    setLatestMovements((latestMovements) => [movement, ...latestMovements]);
  }, []);

  let wantedDirection: Vector2 | undefined;

  const totalMovement = latestMovements.reduce((a, b) => a.add(b), new Vector2());
  // only make a decision once total movement is large enough
  if (totalMovement.lengthSq() > 12 * 12) {
    const angle = totalMovement.angle();
    const nearestAngle90 = roundToNearest(angle, Math.PI / 2);
    wantedDirection = new Vector2(Math.round(Math.cos(nearestAngle90)), Math.round(Math.sin(nearestAngle90)));
  }
  return [wantedDirection, addEvent] as const;
}
