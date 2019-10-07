import React from "react";
import classNames from "classnames";

import "./PurpleButton.scss";

export function PurpleButton(props: JSX.IntrinsicElements["button"]) {
  return <button className={classNames("purple-button", props.className)} {...props}>{props.children}</button>;
}
