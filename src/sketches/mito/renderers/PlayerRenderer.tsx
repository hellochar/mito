import { easeSinInOut } from "d3-ease";
import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneBufferGeometry, Scene, Vector2 } from "three";
import { clamp, lerp2, map, randFloat } from "../../../math";
import { Action, ActionBuild, ActionLong } from "../action";
import { build, deconstruct, dropSugar, dropWater, footsteps, interactSound, sticky } from "../audio";
import { Player } from "../game";
import { Tile } from "../game/tile";
import { Mito } from "../index";
import { textureFromSpritesheet } from "../spritesheet";
import NeuronMesh from "./neuronMesh";
import { Renderer } from "./Renderer";
import { also, Animation, AnimationController, animPause, chain } from "./tile/Animation";

export class PlayerRenderer extends Renderer<Player> {
  public mesh: Mesh;
  public neuronMesh = new NeuronMesh(8);
  protected animation = new AnimationController();
  constructor(target: Player, scene: Scene, mito: Mito) {
    super(target, scene, mito);
    this.mesh = newMesh();
    this.mesh.name = "Player Mesh";
    lerp2(this.mesh.position, this.target.pos, 1);
    this.mesh.position.z = 2;
    this.scene.add(this.mesh);
    this.mesh.add(this.neuronMesh);
    this.target.on("start-long-action", this.handleStartLongAction);
    this.target.on("action", this.handleAction);
  }

  handleStartLongAction = (action: ActionLong) => {
    if (action.effect.type === "build") {
      this.animation.set(this.longBuildAnimation(action as ActionLong<ActionBuild>));
    }
  };

  handleAction = (action: Action) => {
    console.log(action);
    if (action.type === "interact") {
      this.neuronMesh.handleInteracted();
      interactSound.fade(0.2, 0.0, 50);
      interactSound.rate(randFloat(0.8, 1.5));
      // if (!interactSound.playing()) {
      //   interactSound.play();
      //   interactSound.rate(randFloat(0.5, 1.5));
      // }
    } else if (action.type === "build") {
      const id = build.play();
      build.rate(randFloat(0.9, 1.1), id);
    } else if (action.type === "deconstruct") {
      const id = deconstruct.play();
      deconstruct.rate(randFloat(0.9, 1.1), id);
    } else if (action.type === "move") {
      footsteps.fade(0.1, 0, 50);
      footsteps.rate(randFloat(0.8, 1.5));
    } else if (action.type === "drop") {
      if (action.sugar > 0) {
        dropSugar.play();
      }
      if (action.water > 0) {
        const id = dropWater.play();
        dropWater.fade(0.2, 0, 400, id);
      }
    }
  };

  private prevHighlight?: Tile;

  update() {
    const pos = this.target.droopPosFloat().clone();
    this.mesh.position.set(pos.x, pos.y, 2);

    const dt = 1 / 60;
    const isInteract = this.mito.isInteract();
    const highlight = this.mito.getHighlightedTile();
    const neuronMeshTarget = isInteract ? highlight!.pos.clone().sub(pos) : ZERO;
    if (this.prevHighlight !== highlight) {
      const id = sticky.play();
      sticky.rate(randFloat(0.9, 1.1), id);
      sticky.volume(randFloat(0.8, 1), id);
    }
    this.neuronMesh.update(isInteract ? dt * 10 : dt * 5, neuronMeshTarget);
    this.prevHighlight = highlight;
    // this.neuronMesh.visible = this.mito.getHighlightedTile() instanceof Cell;

    // pos.x += Math.cos(Ticker.now / 1000) * 0.04;
    // pos.y += Math.sin(Ticker.now / 400) * 0.08;
    // lerp2(this.mesh.position, pos, 0.5);

    this.animation.update();
  }

  destroy() {
    this.scene.remove(this.mesh);
  }

  longBuildAnimation(actionLong: ActionLong<ActionBuild>): Animation {
    const animWaitForCameraZoomIn = animPause(0.5);
    let w = 0;
    const animShakeDuration = 1.5;
    const animShake: Animation = (t, dt) => {
      const tNorm = t / animShakeDuration;
      // const pow = clamp(polyBiasUpDown(tNorm), 0, 1);
      const pow = clamp(tNorm, 0, 1);
      const shakeFrequency = 9 * Math.sqrt(pow);
      const shakeAmplitude = 0.15 * pow ** 1.5;
      w += dt * Math.PI * 2 * shakeFrequency;
      this.mesh.position.x += Math.sin(w) * shakeAmplitude;
      return tNorm > 1;
    };
    const animPulse: Animation = (t) => {
      const tNorm = t / 0.25;
      const s = map(clamp(4 * (tNorm - tNorm * tNorm), 0, 1), 0, 1, 1, 1.5);
      this.mesh.scale.set(s, s, 1);
      return t > tNorm;
    };
    const animSendCopy = this.animSendCopy(actionLong.effect.position);
    const animWaitEnd = animPause(1);

    const focusCamera: Animation = () => {
      this.mito.suggestCamera({
        center: this.target.posFloat,
        zoom: 3,
      });
      return false;
    };

    return also(chain(animWaitForCameraZoomIn, animShake, also(animSendCopy, animPulse), animWaitEnd), focusCamera);
  }

  animSendCopy(target: Vector2): Animation {
    const copy = newMesh();
    copy.scale.x = this.mesh.scale.x * 1;
    copy.scale.y = this.mesh.scale.y * 1;
    copy.position.z = this.mesh.position.z - 0.01;
    this.scene.add(copy);
    const animDuplicate: Animation = (t) => {
      const tNorm = t / 0.5;
      const dX = easeSinInOut(tNorm) * 0.5;
      this.mesh.position.x -= dX;
      lerp2(copy.position, this.target.droopPosFloat(), 1);
      copy.position.x += dX;
      return tNorm > 1;
    };
    const animStayLeft: Animation = (t) => {
      this.mesh.position.x -= 0.5;
      return false;
    };
    const animReturnOriginal: Animation = (t) => {
      const tNorm = t / 0.5;
      const dX = easeSinInOut(1 - tNorm) * 0.5;
      this.mesh.position.x -= dX;
      return tNorm > 1;
    };
    const animShrinkAndMove: Animation = (t, dt) => {
      const tNorm = t / 1.2;
      // lerp2(copy.position, this.mesh.position, 1);
      lerp2(copy.position, target, 0.1);
      // lerp2(copy.position, target, easeExpOut(tNorm));
      // lerp2(copy.scale, { x: this.mesh.scale.x, y: this.mesh.scale.y }, 1);
      // lerp2(copy.scale, { x: this.mesh.scale.x * 0.2, y: this.mesh.scale.y * 0.2 }, easeSinInOut(tNorm));
      lerp2(copy.scale, { x: this.mesh.scale.x * 0.2, y: this.mesh.scale.y * 0.2 }, 0.1);
      return tNorm > 1;
    };
    const animShrinkToZeroAndRemove: Animation = (t) => {
      const tNorm = t / 0.5;
      lerp2(copy.scale, { x: this.mesh.scale.x * 0.2, y: this.mesh.scale.y * 0.2 }, 1);
      lerp2(copy.scale, { x: 0, y: 0 }, easeSinInOut(tNorm));

      const ended = tNorm > 1;
      if (ended) {
        this.scene.remove(copy);
      }
      return ended;
    };
    return chain(
      animDuplicate,
      also(animPause(0.5), animStayLeft),
      also(animShrinkAndMove, animReturnOriginal),
      animShrinkToZeroAndRemove
    );
  }
}

function newMesh() {
  const m = new Mesh(
    new PlaneBufferGeometry(0.75, 0.75),
    new MeshBasicMaterial({
      transparent: true,
      // depthWrite: false,
      // depthTest: false,
      map: textureFromSpritesheet(3, 2, "transparent"),
      color: new Color("white"),
      side: DoubleSide,
    })
  );
  m.renderOrder = 9;
  return m;
}

const ZERO = new Vector2();
