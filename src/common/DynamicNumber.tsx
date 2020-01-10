import Ticker from "global/ticker";
import React from "react";
import { nf } from "./formatters";

export interface DynamicNumberProps {
  value: number;
  speed?: number;
  sigFigs?: number;
}

function DynamicNumber({ value, speed = 0.5, sigFigs = 3 }: DynamicNumberProps) {
  const [v, setV] = React.useState(value);

  React.useEffect(() => {
    const id = Ticker.addAnimation(() => {
      setV((v) => {
        if (Math.abs(v - value) < 5e-3) {
          Ticker.removeAnimation(id);
          return value;
        } else {
          return v * (1 - speed) + value * speed;
        }
      });
    });
    return () => {
      Ticker.removeAnimation(id);
    };
  }, [value, speed]);

  return <>{nf(v, sigFigs)}</>;
}

export default DynamicNumber;
