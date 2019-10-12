import React from "react";
import { GiDna1 } from "react-icons/gi";

import "./MP.scss";
import classNames from "classnames";

export type MPProps = JSX.IntrinsicElements["div"] & {
  amount: number;
  total?: number;
}

function MP({ amount, total, ...props }: MPProps) {
  return (
    <div {...props} className={classNames("mp", props.className)}>
      {amount}
      {total != null ? <>/{total}</> : null}
      <GiDna1 className="mp-icon" />
    </div>
  );
}

export default MP;
