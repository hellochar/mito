import locustsSrc from "assets/images/grasshopper.png";
import { Environment } from "core/environment";
import { LevelInfo } from "core/overworld/levelInfo";
import { Species } from "core/species";
import React from "react";
import { environmentFromLevelInfo } from "std/environments";
import { HexTile } from "../../../../core/overworld/hexTile";
import { Button } from "../../common/Button";
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

  const floraInfo =
    flora != null ? (
      <div className="inhabited">
        <p>
          Inhabited by{" "}
          <b>
            <i>{flora.species.name}</i>
          </b>
        </p>
        <p>
          <MP amount={flora.mutationPointsPerEpoch} /> per epoch
        </p>
      </div>
    ) : null;

  const stringifyInfo = { ...tile.info };
  delete stringifyInfo.flora;

  const habitableInfo = tile.isHabitable ? (
    <EnvironmentInfo info={tile.info} environment={environmentFromLevelInfo(tile.info)} />
  ) : (
    <p style={{ color: "red" }}>Uninhabitable</p>
  );

  return (
    <div className="hex-info-container">
      <div className="header">{tile.displayName}</div>
      <div className="body">
        {floraInfo}
        {habitableInfo}
      </div>
      {playButtonElement}
    </div>
  );
}

const EnvironmentInfo: React.FC<{ environment: Environment; info: LevelInfo }> = ({ environment, info }) => {
  return (
    <div className="environment-info">
      {environment.insectsPerDay > 0 ? (
        <div className="insects">
          <img src={locustsSrc} />
          <b>Has Locusts</b>
        </div>
      ) : null}
      <div>
        <b>Rainfall</b>: {info.rainfall}
      </div>
      <div>
        <b>Temperature</b>: {info.temperature}
      </div>
      <div>
        <b>Soil Type</b>: {info.soilType}
      </div>
    </div>
  );
};

export default HexInfo;
