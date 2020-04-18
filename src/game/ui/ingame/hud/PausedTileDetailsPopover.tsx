import { Popover } from "@blueprintjs/core";
import { Tile } from "core/tile";
import { WorldDOMComponent } from "game/mito/WorldDOMElement";
import React from "react";
import Mito from "../../../mito/mito";
import { TileDetails } from "../TileDetails";

export const PausedTileDetailsPopover = ({ mito, tile }: { mito: Mito; tile: Tile }) => {
  const positionFn = React.useCallback(() => tile, [tile]);
  return (
    <WorldDOMComponent mito={mito} positionFn={positionFn} className="paused-popover">
      <Popover
        content={<TileDetails key={tile.toString()} tile={tile} />}
        usePortal={false}
        autoFocus={false}
        isOpen
        minimal
      >
        <span />
      </Popover>
    </WorldDOMComponent>
  );
};
