import React from "react";
import Ticker from "std/ticker";

export class Animate extends React.Component<{
  a: (time: number) => void;
}> {
  private rafid?: number;

  private animate = (time: number) => {
    this.props.a(time / 1000);
  };

  render() {
    return null;
  }

  componentDidMount() {
    this.rafid = Ticker.addAnimation(this.animate);
  }

  componentWillUnmount() {
    if (this.rafid) {
      Ticker.removeAnimation(this.rafid);
    }
  }
}
