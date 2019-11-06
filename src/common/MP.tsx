import classNames from "classnames";
import React from "react";
import { GiDna1 } from "react-icons/gi";
import DynamicNumber from "./DynamicNumber";
import "./MP.scss";

export type MPProps = JSX.IntrinsicElements["div"] & {
  amount: number;
  total?: number;
};

const MP_NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
  useGrouping: true,
});

function MP({ amount, total, ...props }: MPProps) {
  return (
    <span {...props} className={classNames("mp", props.className)}>
      <DynamicNumber speed={0.3} formatter={MP_NUMBER_FORMATTER} value={amount} />
      {total != null ? <>/{total}</> : null}
      <GiDna1 className="mp-icon" />
    </span>
  );
}

export default MP;
