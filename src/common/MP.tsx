import classNames from "classnames";
import React from "react";
import { GiDna1 } from "react-icons/gi";
import DynamicNumber from "./DynamicNumber";
import "./MP.scss";

export type MPProps = JSX.IntrinsicElements["div"] & {
  amount: number;
  total?: number;
};

function MP({ amount, total, ...props }: MPProps) {
  return (
    <span {...props} className={classNames("mp", props.className)}>
      <DynamicNumber speed={0.5} sigFigs={5} value={amount} />
      {total != null ? <>/{total}</> : null}
      <GiDna1 className="mp-icon" />
    </span>
  );
}

export default MP;
