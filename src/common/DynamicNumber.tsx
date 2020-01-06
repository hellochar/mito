import Ticker from "global/ticker";
import React from "react";

interface DynamicNumberProps {
  value: number;
  speed?: number;
  formatter?: Intl.NumberFormat;
}

const NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
  useGrouping: true,
});

function DynamicNumber({ value, speed = 0.5, formatter = NUMBER_FORMATTER }: DynamicNumberProps) {
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

  return <>{formatter.format(v)}</>;
}

export default DynamicNumber;
