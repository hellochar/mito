import classNames from "classnames";
import React from "react";
import { CellType } from "../../../core/cell/genome";
import { textureFromSpritesheet } from "../../spritesheet";
import "./IconCell.scss";

export const ActionBarItem: React.FC<React.HTMLProps<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div className={classNames("action-bar-item", className)} {...props}>
      {children}
    </div>
  );
};

const IconCell: React.FC<{ cellType: CellType; spritesheetLoaded: boolean } & React.HTMLProps<HTMLDivElement>> = ({
  children,
  cellType,
  spritesheetLoaded,
  ...props
}) => {
  const { material } = cellType;
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
  return (
    <ActionBarItem {...props} className="icon-cell" style={style}>
      {children}
    </ActionBarItem>
  );
};
export default IconCell;
