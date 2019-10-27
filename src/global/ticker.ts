
export type TickerCallback = (time: number) => boolean | void;
class TickerClass {
  private tickerId = 1;

  private tickers: Record<number, TickerCallback> = {};

  private _time = 0;

  get now() {
    return this._time;
  }

  tickerLoop = (time: number) => {
    this._time = time;
    const toDelete: number[] = [];
    for (const id in this.tickers) {
      const f = this.tickers[id];
      const shouldDelete = f(time);
      if (shouldDelete === true) {
        toDelete.push(Number(id));
      }
    }
    for (const id of toDelete) {
      this.removeAnimation(id);
    }
    requestAnimationFrame(this.tickerLoop);
  }

  /**
   * Return true to kill the ticker.
   */
  public addAnimation(fn: TickerCallback) {
    const id = this.tickerId++;
    this.tickers[id] = fn;
    return id;
  }

  public removeAnimation(id: number) {
    return delete this.tickers[id];
  }

  public start() {
    requestAnimationFrame(this.tickerLoop);
  }
}

const Ticker = new TickerClass();
Ticker.start();

export default Ticker;
