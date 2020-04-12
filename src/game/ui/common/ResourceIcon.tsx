import sugarSrc from "assets/images/sugar.png";
import waterSrc from "assets/images/water.png";
import * as React from "react";
export interface ResourceIconProps {
  name?: "water" | "sugar" | "w" | "s";
  w?: boolean;
  s?: boolean;
}

export const ResourceIcon: React.FC<ResourceIconProps> = React.memo(({ name, s }) => (
  <img alt="" src={s || name === "sugar" || name === "s" ? sugarSrc : waterSrc} className="resource-icon" />
));
