import { Entity } from "./entity";

export interface Interactable {
  /**
   * Return true if an interaction was successful.
   */
  interact(source: Entity, dt: number): boolean;
}

export function isInteractable<T>(e: T): e is Interactable & T {
  return typeof (e as any).interact === "function";
}
