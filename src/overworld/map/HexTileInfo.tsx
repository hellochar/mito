import { Species } from "evolution/species";
import React from "react";
import { Button } from "../../common/Button";
import Expand from "../../common/Expand";
import MP from "../../common/MP";
import { HexTile } from "../hexTile";
import "./HexTileInfo.scss";

interface HexTileInfoProps {
  playSpecies: Species;
  tile: HexTile;
  onClickPlay: (level: HexTile, species: Species) => void;
}

function HexTileInfo({ playSpecies, tile, onClickPlay }: HexTileInfoProps) {
  const handleClickPlay = () => {
    onClickPlay(tile, playSpecies);
  };

  const { height, flora } = tile.info;

  const playButtonElement =
    (height === -1) ? null : (
      <div className="play-selector">
        <span>{playSpecies.name}</span>
        <Button color="green" className="play-button" onClick={handleClickPlay} disabled={tile.info.flora && tile.info.flora.actionPoints < 1}>
          Migrate
        </Button>
      </div>
    );

  const header = flora != null ? (
    <div>
      <h1>Inhabited by <i>{flora.species.name}</i></h1>
      <p><MP amount={flora.mutationPointsPerEpoch} /> per epoch</p>
      <p>Action Points: {flora.actionPoints}</p>
    </div >
  ) : tile.info.height === -1 ? (
    <h1>Deep Water</h1>
  ) : (
        <h1>Uninhabited</h1>
      );

  const stringifyInfo = { ...tile.info };
  delete stringifyInfo.flora;

  const expand =
    tile.info.height === -1 ? null : (
      <Expand shrunkElements={<div className="details">Details</div>}>
        <pre style={{ fontSize: "12px" }}>{JSON.stringify(tile.info, null, 4)}</pre>
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
