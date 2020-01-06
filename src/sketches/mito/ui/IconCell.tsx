import React from "react";
import { Constructor } from "../constructor";
import { Tile } from "../game/tile";
import { materialInfoMapping } from "../renderers/tile/InstancedTileRenderer";
import { textureFromSpritesheet } from "../spritesheet";

const IconCell: React.FC<
  { cellType: Constructor<Tile>; spritesheetLoaded: boolean } & React.HTMLProps<HTMLDivElement>
> = ({ children, cellType, spritesheetLoaded, ...props }) => {
  const material = materialInfoMapping.get(cellType)!;
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
    <div {...props} className="cell-bar-item-icon" style={style}>
      {children}
    </div>
  );
};
export default IconCell;
