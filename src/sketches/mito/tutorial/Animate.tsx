import React from "react";

export class Animate extends React.Component<{
  a: (time: number) => void;
}> {
  private rafid?: number;
  private animate = (time: number) => {
    this.props.a(time / 1000);
    this.rafid = requestAnimationFrame(this.animate);
  };
  render() {
    return null;
  }
  componentDidMount() {
    this.rafid = requestAnimationFrame(this.animate);
  }
  componentWillUnmount() {
    if (this.rafid) {
      cancelAnimationFrame(this.rafid);
    }
  }
}
