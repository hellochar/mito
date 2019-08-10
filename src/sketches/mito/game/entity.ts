import { Tile } from "./tile";
import { Player } from "./player";

export type Entity = Tile | Player;

interface Steppable {
    step(): void;
}

export function isSteppable(obj: any): obj is Steppable {
    return typeof obj.step === "function";
}
