import { Species } from "core/species";
import React from "react";
import { HexTile } from "../../../../core/overworld/hexTile";
import { Button } from "../../common/Button";
import Expand from "../../common/Expand";
import MP from "../../common/MP";
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
        <Button color="green" className="play-button" onClick={onClickPlay}>
          Play Level
        </Button>
      </div>
    );

  const body =
    flora != null ? (
      <>
        <p>
          Inhabited by{" "}
          <b>
            <i>{flora.species.name}</i>
          </b>
        </p>
        <p>
          <MP amount={flora.mutationPointsPerEpoch} /> per epoch
        </p>
      </>
    ) : tile.isHabitable ? null : (
      <p style={{ color: "red" }}>Uninhabitable</p>
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
      <div className="header">{tile.displayName}</div>
      <div className="body">{body}</div>
      {expand}
      {playButtonElement}
    </div>
  );
}

export default HexInfo;
