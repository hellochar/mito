
// export type Serializable = number
//   | string
//   | SerializableObject<any>
//   | Serializable[]
//   | { [key: string]: Serializable };

// export interface SerializableObject<SerializedType extends Serializable> {
//   serialize(): SerializedType;
//   deserialize(s: SerializedType): this;
// }

// interface AppStateJson {
//   overWorld: {
//     startTile:
//   }
// }

// export function serialize(appState: AppState): string {

// }

// export function deserialize(s: string): AppState {

// }

export interface HexTileJson {
  i: number;
  j: number;
}

interface SerializableConstructor<T, S extends T> {
  new(...args: any[]): S;
  serialize(s: S): T;
  deserialize(t: T): S;
}

interface HexTile extends HexTileJson {
  readonly k: number;
  readonly magnitude: number;
}

const HexTile: SerializableConstructor<HexTileJson, HexTile> = class HexTile {
  i: number;
  j: number;

  get k() {
    return -(this.i + this.j);
  }
  get magnitude() {
    return Math.abs(this.i) + Math.abs(this.j) + Math.abs(this.k);
  }

  foo() { return 3; }

  constructor(i: number, j: number) {
    this.i = i;
    this.j = j;
  }

  static serialize(s: HexTile): HexTileJson {
    const { i, j } = s;
    return {
      i, j
    }
  }

  static deserialize(json: HexTileJson): HexTile {
    return new HexTile(json.i, json.j);
  }
};

const h1 = new HexTile(1, 1);

const json = HexTile.serialize(h1);
const hexTile = HexTile.deserialize(json);
console.log(hexTile.k);
