import * as React from "react";
import * as THREE from "three";

export const UI_EVENTS = {
  click: true,
  contextmenu: true,
  dblclick: true,
  mousedown: true,
  mouseup: true,
  mousemove: true,
  touchstart: true,
  touchmove: true,
  touchend: true,
  keyup: true,
  keydown: true,
  keypress: true,
  wheel: true,
};

export type UIEventReciever = {
  [E in keyof typeof UI_EVENTS]?: (this: HTMLElement, ev: GlobalEventHandlersEventMap[E]) => void;
  // [E in keyof typeof UI_EVENTS]?: (ev: Event) => void;
};

export abstract class ISketch {
  static id?: string;

  public elements?: JSX.Element[];

  public events?: UIEventReciever;

  /**
   * milliseconds since sketch started running.
   */
  public timeElapsed = 0;

  public frameCount = 0;

  constructor(public renderer: THREE.WebGLRenderer, public audioContext: SketchAudioContext) {}

  /**
   * height / width
   */
  get aspectRatio() {
    return this.renderer.domElement.height / this.renderer.domElement.width;
  }

  get resolution() {
    return new THREE.Vector2(this.renderer.domElement.width, this.renderer.domElement.height);
  }

  get canvas() {
    return this.renderer.domElement;
  }

  abstract animate(millisElapsed: number): void;

  render?(): React.ReactNode;

  resize?(width: number, height: number): void;

  destroy?(): void;
}

export interface SketchConstructor {
  new (renderer: THREE.WebGLRenderer, audioContext: SketchAudioContext, ...otherArgs: any[]): ISketch;

  id?: string;
}

export interface SketchAudioContext extends AudioContext {
  gain: GainNode;
}
