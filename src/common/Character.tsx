import classNames from "classnames";
import React from "react";

import characterSrc from "assets/images/character.png";

import "./Character.scss";

function Character(props: JSX.IntrinsicElements["img"] & { size?: "xs" | "small" | "medium" | "large" }) {
  const { size, ...otherProps } = props;
  return (
    <img
      className={classNames("character", size)}
      alt=""
      src={characterSrc}
      {...otherProps}
    />
  );
}

export default Character;
