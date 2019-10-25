export interface Interactable {
  interact(): void;
}

export function isInteractable<T>(e: T): e is Interactable & T {
  return typeof (e as any).interact === "function";
}
