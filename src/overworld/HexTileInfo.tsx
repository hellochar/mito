import React from "react";

import { HexTile } from "./hexTile";
import Expand from "../common/Expand";

import "./HexTileInfo.scss";
import { Button } from "../evolution/Button";

interface HexTileInfoProps {
  tile: HexTile;
  onClickPlay: (level: HexTile) => void;
}

function HexTileInfo({ tile, onClickPlay }: HexTileInfoProps) {
  const handleClickPlay = () => {
    onClickPlay(tile);
  };

  const { height, flora } = tile.info;

  const playButtonElement =
    (height === -1 || flora != null) ? null : (
      <Button color="green" className="play-button" onClick={handleClickPlay}>
        Populate
      </Button>
    );

  const header = flora != null ? (
    <h1>Inhabited by {flora.species}<small>{flora.mutationPointsPerEpoch} MP / epoch</small></h1>
  ) : tile.info.height === -1 ? (
    <h1>Deep Water</h1>
  ) : (
        <h1>Uninhabited</h1>
      );

  const stringifyInfo = { ...tile.info };
  delete stringifyInfo.world;

  const expand =
    tile.info.height === -1 ? null : (
      <Expand shrunkElements={<div className="details">Details</div>}>
        <pre style={{ fontSize: "12px" }}>{JSON.stringify(stringifyInfo, null, 4)}</pre>
      </Expand>
    );

  return (
    <div className="hex-tile-info-container">
      {header}
      {expand}
      {playButtonElement}
    </div>
  );
}

export default HexTileInfo;
