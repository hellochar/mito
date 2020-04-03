import classNames from "classnames";
import Tooltip from "rc-tooltip";
import React from "react";
import { GiDna1 } from "react-icons/gi";
import DynamicNumber from "./DynamicNumber";
import "./MP.scss";

export type MPProps = JSX.IntrinsicElements["div"] & {
  amount: number;
  total?: number;
};

function MP({ amount, total, ...props }: MPProps) {
  const tooltipContent = (
    <>
      <div>
        Mutation Points (MP) provide new Genes, and are earned by building reproducer cells like Seeds or Fruit.
      </div>
      <div>MP refreshes every epoch.</div>
    </>
  );
  return (
    <Tooltip placement="top" overlay={tooltipContent}>
      <span {...props} className={classNames("mp", props.className)}>
        <DynamicNumber speed={0.5} sigFigs={5} value={amount} />
        {total != null ? <>/{total}</> : null}
        <GiDna1 className="mp-icon" />
      </span>
    </Tooltip>
  );
}

export default MP;
