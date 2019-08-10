import { Tile } from "./tile";
import { Player } from "./player";

export type Entity = Tile | Player;

export interface Steppable {
    step(): void;
}

export function isSteppable(obj: any): obj is Steppable {
    return typeof obj.step === "function";
}
