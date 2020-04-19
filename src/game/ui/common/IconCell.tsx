import classNames from "classnames";
import React from "react";
import { CellType } from "../../../core/cell/genome";
import { textureFromSpritesheet } from "../../spritesheet";
import "./IconCell.scss";
import { ResourceIcon } from "./ResourceIcon";

export const ActionBarItem: React.FC<React.HTMLProps<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div className={classNames("action-bar-item", className)} {...props}>
      {children}
    </div>
  );
};

const IconCell: React.FC<{ cellType: CellType; showCosts?: boolean; spritesheetLoaded: boolean } & React.HTMLProps<
  HTMLDivElement
>> = ({ children, cellType, spritesheetLoaded, showCosts = false, ...props }) => {
  const { material } = cellType;
  const { costSugar, costWater, timeToBuild } = cellType.chromosome.computeStaticProperties();
  const color = (material.color && material.color.getStyle()) || "transparent";
  const texture = textureFromSpritesheet(material.texturePosition.x, material.texturePosition.y, color);
  const style: React.CSSProperties = React.useMemo(() => {
    const image = texture.image;
    const url = (() => {
      if (image != null) {
        if (image instanceof HTMLCanvasElement && spritesheetLoaded) {
          return image.toDataURL();
        } else if (image instanceof Image) {
          return image.src;
        } else {
          throw new Error("image is" + image);
        }
      } else {
        return "";
      }
    })();
    const backgroundImage = `url(${url}), linear-gradient(${color}, ${color})`;
    return {
      backgroundImage,
    };
  }, [color, spritesheetLoaded, texture.image]);

  const costsEl = showCosts ? (
    <div className="costs">
      <div className="time-to-build-info">{timeToBuild} sec</div>
      <div className="cost-to-build-info">
        {costWater}
        <ResourceIcon name="water" />
        {costSugar}
        <ResourceIcon name="sugar" />
      </div>
    </div>
  ) : null;

  return (
    <ActionBarItem
      {...props}
      className={classNames("icon-cell", { reproducer: cellType.isReproducer() })}
      style={style}
    >
      {children}
      {costsEl}
    </ActionBarItem>
  );
};
export default IconCell;
