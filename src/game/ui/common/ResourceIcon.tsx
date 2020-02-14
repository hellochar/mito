import sugarSrc from "assets/images/sugar.png";
import waterSrc from "assets/images/water.png";
import * as React from "react";
export const ResourceIcon: React.FC<{
  name: "sugar" | "water";
}> = React.memo(({ name }) => <img alt="" src={name === "sugar" ? sugarSrc : waterSrc} className="resource-icon" />);
