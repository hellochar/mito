import { EventEmitter } from "events";
import { Vector2 } from "three";

// floating point rounding error fix
// without: 0.8 - 0.1 = 0.7000000000000001
// with: fpref(0.8 - 0.1) = 0.7
function fpref(x: number) {
  return Math.round(x * 1e12) / 1e12;
}

interface HasPosition {
  pos: Vector2;
}

export class Inventory {
  constructor(
    public capacity: number,
    public carrier: HasPosition,
    public water: number = 0,
    public sugar: number = 0
  ) {
    if (process.env.NODE_ENV === "development") {
      this.validate();
    }
  }

  public isEmpty() {
    return this.water === 0 && this.sugar === 0;
  }

  has(water: number, sugar: number) {
    return this.water >= water && this.sugar >= sugar;
  }

  public give(other: Inventory, amountWater: number, amountSugar: number) {
    if (other === this) {
      throw new Error("shouldn't give to self");
    }
    if (amountWater === 0 && amountSugar === 0) {
      return { water: 0, sugar: 0 };
    }
    // to check:
    // 1) we have enough water and sugar
    //      if we don't, cap water and sugar to the amount available
    // 2) other has enough space
    //      if it doesn't, scale down to the amount that is available
    // 3) if negative, check how much you can take from other
    let water = amountWater > 0 ? Math.min(amountWater, this.water) : -Math.min(-amountWater, other.water);
    let sugar = amountSugar > 0 ? Math.min(amountSugar, this.sugar) : -Math.min(-amountSugar, other.sugar);

    const spaceNeeded = fpref(water + sugar);
    const spaceAvailable = other.space();
    if (spaceNeeded > spaceAvailable) {
      // scale down the amount to give
      // give less than capacity
      water = Math.floor((water / spaceNeeded) * spaceAvailable);
      sugar = Math.floor((sugar / spaceNeeded) * spaceAvailable);
    }
    if (water !== 0 || sugar !== 0) {
      this.change(-water, -sugar);
      other.change(water, sugar);
      if (this.events) {
        this.events.emit("give", other, water, sugar);
      }
      if (other.events) {
        other.events.emit("get", this, water, sugar);
      }
    }
    return { water, sugar };
  }

  private events?: EventEmitter;

  public on(name: "give" | "get" | "add", fn: (...args: any[]) => void) {
    this.events = this.events || new EventEmitter();
    this.events.on(name, fn);
  }

  public off(name: "give" | "get" | "add", fn: (...args: any[]) => any) {
    this.events = this.events || new EventEmitter();
    this.events.off(name, fn);
  }

  /**
   * Set resources to an exact value; usually used in tile generation.
   */
  public set(water: number, sugar: number) {
    this.water = 0;
    this.sugar = 0;
    this.add(water, sugar);
  }

  public add(water: number, sugar: number) {
    const spaceNeeded = fpref(water + sugar);
    const spaceAvailable = this.space();
    if (spaceNeeded > spaceAvailable) {
      // scale down the amount to give
      water = (water / spaceNeeded) * spaceAvailable;
      sugar = (sugar / spaceNeeded) * spaceAvailable;
    }
    this.change(water, sugar);
    if (this.events) {
      this.events.emit("add", water, sugar);
    }
  }

  private change(water: number, sugar: number) {
    const newWater = fpref(this.water + water);
    const newSugar = fpref(this.sugar + sugar);
    if (process.env.NODE_ENV === "development") {
      this.validate();
    }
    this.water = newWater;
    this.sugar = newSugar;

    // fixup if needed
    if (this.water < 0) {
      this.water = 0;
    }
    if (this.sugar < 0) {
      this.sugar = 0;
    }
    if (this.water + this.sugar > this.capacity) {
      if (this.water > this.sugar) {
        this.water = this.capacity - this.sugar;
      } else {
        this.sugar = this.capacity - this.water;
      }
    }
  }

  public space() {
    const { capacity, water, sugar } = this;
    return fpref(capacity - water - sugar);
  }

  public isMaxed() {
    return this.space() < 1;
  }

  validate(water: number = this.water, sugar: number = this.sugar) {
    const { capacity } = this;
    if (water < 0) {
      console.warn(`water < 0: ${water}`);
      // throw new Error(`water < 0: ${water}`);
    }
    if (sugar < 0) {
      console.warn(`sugar < 0: ${sugar}`);
      // throw new Error(`sugar < 0: ${sugar}`);
    }
    if (water + sugar > capacity) {
      console.warn(`bad inventory: ${water} water + ${sugar} > ${capacity} max`);
      // throw new Error(`bad inventory: ${water} water + ${sugar} > ${capacity} max`);
    }
  }
}
