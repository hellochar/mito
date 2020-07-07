import locustsSrc from "assets/images/grasshopper.png";
import { nf } from "common/formatters";
import { Environment } from "core/environment";
import { LevelInfo } from "core/overworld/levelInfo";
import { Species } from "core/species";
import TemperatureGauge from "game/ui/ingame/TemperatureGauge";
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
          <MP amount={flora.mutationPointsPerEpoch} /> per epoch.
        </p>
        <p>{flora.oxygenContribution} oxygen per second.</p>
      </div>
    ) : null;

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
  const { timeBetweenRainfall, rainDuration, waterPerSecond } = environment.climate;
  const frequency = timeBetweenRainfall >= 90 ? "infrequently" : timeBetweenRainfall >= 45 ? "regularly" : "often";
  const rainAmount = rainDuration * waterPerSecond;
  const intensity = rainAmount < 450 ? "drizzles" : rainAmount < 750 ? "rains" : "downpours";
  const rainfallDescription = `${frequency} ${intensity}`;
  return (
    <div className="environment-info">
      <div>
        <table className="bp3-html-table bp3-html-table-condensed">
          <thead>
            <tr>
              <th />
              <th>Spring</th>
              <th>Summer</th>
              <th>Fall</th>
              <th>Winter</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>Temperature</b>
              </td>
              {environment.temperaturePerSeason.map((t) => (
                <td>
                  <TemperatureGauge temperature={t} showMild />
                </td>
              ))}
            </tr>
            <tr>
              <td>
                <b>Length of Day</b>
              </td>
              {environment.daylightPerSeason.map((percent) => (
                <td>{nf(percent * 100, 2)}%</td>
              ))}
            </tr>
            <tr>
              <td>
                <b>Rainfall</b>
              </td>
              <td colSpan={4} className="rainfall">
                {rainfallDescription}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {environment.insectsPerDay > 0 ? (
        <div className="insects">
          <img src={locustsSrc} alt="" />
          <b>Has Locusts</b>
        </div>
      ) : null}
    </div>
  );
};

export default HexInfo;
