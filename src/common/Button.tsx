import React from "react";
import classNames from "classnames";

import "./Button.scss";

export function Button(props: JSX.IntrinsicElements["button"] & { color?: "purple" | "green" }) {
  return (
    <button {...props} className={classNames("button", props.className, props.color || "purple")}>
      {props.children}
    </button>
  );
}
