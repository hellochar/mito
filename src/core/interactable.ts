import { Action } from "./player/action";
import { Player } from "./player/player";

/**
 * This thing can be interacted with by the player.
 */
export interface Interactable {
  /**
   * What action, if any, the player should take when
   * interacted on by the player.
   */
  interact(source: Player): Action | undefined;
}

export function isInteractable<T>(e: T): e is Interactable & T {
  return typeof (e as any).interact === "function";
}
