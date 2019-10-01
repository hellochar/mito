import React from "react";

import { HexTile } from "./hexTile";
import Expand from "../common/Expand";

import "./HexTileInfo.scss";

interface HexTileInfoProps {
  tile: HexTile;
  onClickPlay: (level: HexTile) => void;
}

function HexTileInfo({ tile, onClickPlay }: HexTileInfoProps) {
  const handleClickPlay = () => {
    onClickPlay(tile);
  }

  const playButtonElement = (tile.info.height === -1 || tile.info.conquered) ? null :
    <div className="play-button" onClick={handleClickPlay}>Populate</div>;

  const header =
    tile.info.conquered ? <h1>Populated</h1> :
    (tile.info.height === -1) ? <h1>Deep Water</h1> :
    <h1>Unexplored</h1>;

  const stringifyInfo = { ...tile.info };
  delete stringifyInfo.world;

  const expand = (tile.info.height === -1) ? null :
    <Expand shrunkElements={
      <div className="details">Details</div>
    }>
      <pre style={{ fontSize: "12px" }}>{JSON.stringify(stringifyInfo, null, 4)}</pre>
    </Expand>;

  return (
    <div className="hex-tile-info-container">
      {header}
      {expand}
      {playButtonElement}
    </div>
  );
}

export default HexTileInfo;
