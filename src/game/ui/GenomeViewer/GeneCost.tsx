import classNames from "classnames";
import DynamicNumber from "game/ui/common/DynamicNumber";
import React from "react";
export function GeneCost({
  cost,
  className,
  ...props
}: {
  cost: number;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={classNames("gene-cost", className, {
        negative: cost < 0,
      })}
    >
      {cost < 0 ? "+" : null}
      <DynamicNumber value={Math.abs(cost)} speed={0.5} />
    </span>
  );
}
