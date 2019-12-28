import characterSrc from "assets/images/character.png";
import classNames from "classnames";
import React from "react";
import "./Character.scss";

function Character(props: JSX.IntrinsicElements["img"] & { size?: "xs" | "small" | "medium" | "large" }) {
  const { size, className, ...otherProps } = props;
  return <img className={classNames("character", size, className)} alt="" src={characterSrc} {...otherProps} />;
}

export default Character;
