export interface Interactable {
  interact(dt: number): void;
}

export function isInteractable<T>(e: T): e is Interactable & T {
  return typeof (e as any).interact === "function";
}
