
class TickerClass {
  private tickerId = 1;

  private tickers: Record<number, (time: number) => void> = {};

  tickerLoop = (time: number) => {
    for (const id in this.tickers) {
      const f = this.tickers[id];
      f(time);
    }
    requestAnimationFrame(this.tickerLoop);
  }

  public addAnimation(fn: (time: number) => void) {
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
