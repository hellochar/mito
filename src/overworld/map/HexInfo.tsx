import { Species } from "core/species";
import React from "react";
import { Button } from "../../common/Button";
import Expand from "../../common/Expand";
import MP from "../../common/MP";
import { HexTile } from "../hexTile";
import "./HexInfo.scss";

interface HexInfo {
  playSpecies: Species;
  tile: HexTile;
  onClickPlay: () => void;
}

function HexInfo({ playSpecies, tile, onClickPlay }: HexInfo) {
  const { height, flora } = tile.info;

  const playButtonElement =
    height === -1 ? null : (
      <div className="play-selector">
        <span>{playSpecies.name}</span>
        <Button color="green" className="play-button" onClick={onClickPlay}>
          Play Level
        </Button>
      </div>
    );

  const header =
    flora != null ? (
      <div>
        <h1>
          Inhabited by <i>{flora.species.name}</i>
        </h1>
        <p>
          <MP amount={flora.mutationPointsPerEpoch} /> per epoch
        </p>
      </div>
    ) : tile.isHabitable ? (
      <h1>Uninhabited</h1>
    ) : (
      <h1>Uninhabitable (Deep Water)</h1>
    );

  const stringifyInfo = { ...tile.info };
  delete stringifyInfo.flora;

  const expand = tile.isHabitable ? (
    <Expand shrunkElements={<div className="details">Details</div>}>
      <pre style={{ fontSize: "12px" }}>{JSON.stringify(stringifyInfo, null, 4)}</pre>
    </Expand>
  ) : null;

  return (
    <div className="hex-info-container">
      {header}
      {expand}
      {playButtonElement}
    </div>
  );
}

export default HexInfo;
