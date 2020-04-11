import { nf } from "common/formatters";
import React from "react";
import { GeneStaticProperties } from "../../../core/cell/gene";
export const StaticPropertiesViewer: React.FC<GeneStaticProperties> = React.memo(
  ({ diffusionWater, diffusionSugar, inventoryCapacity, isDirectional, isObstacle, isReproductive }) => {
    return (
      <div className="static-properties">
        {diffusionWater !== 0 ? (
          <span className="diffusion-water">
            Diffusion Water <b>{nf(diffusionWater, 4)}</b>
          </span>
        ) : null}
        {diffusionSugar !== 0 ? (
          <span className="diffusion-sugar">
            Diffusion Sugar <b>{nf(diffusionSugar, 4)}</b>
          </span>
        ) : null}
        <span className="diffusion-rate">Inventory {inventoryCapacity}</span>
        {isDirectional ? <span className="directional">Directional</span> : null}
        {isReproductive ? <span className="reproductive">Reproductive</span> : null}
        {isObstacle ? <span className="obstacle">Obstacle</span> : null}
      </div>
    );
  }
);
