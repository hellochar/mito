import { Scene } from "three";
import { Mito } from "../../sketches/mito/mito";
export abstract class Renderer<T> {
  constructor(public target: T, public scene: Scene, public mito: Mito) {}

  abstract update(): void;

  abstract destroy(): void;
}
