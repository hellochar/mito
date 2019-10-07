import classNames from "classnames";
import React from "react";

import "./Character.scss";

function Character(props: JSX.IntrinsicElements["img"] & { size?: "small" | "medium" | "large" }) {
  const { size, ...otherProps } = props;
  return (
    <img
      className={classNames("character", size)}
      alt=""
      src="/assets/images/character.png"
      {...otherProps}
    />
  );
}

export default Character;
