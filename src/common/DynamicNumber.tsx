import Ticker from "global/ticker";
import React from "react";

export interface DynamicNumberProps {
  value: number;
  speed?: number;
  fractionDigits?: number;
}

function DynamicNumber({ value, speed = 0.5, fractionDigits = 2 }: DynamicNumberProps) {
  const [v, setV] = React.useState(value);
  const formatter = React.useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        maximumFractionDigits: fractionDigits,
        useGrouping: true,
      }),
    [fractionDigits]
  );

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

  return <>{formatter.format(v)}</>;
}

export default DynamicNumber;
