import { Tooltip } from "@blueprintjs/core";
import classNames from "classnames";
import { Temperature, temperatureFor } from "core/temperature";
import * as React from "react";
import { Season, SEASON_NAMES } from "../../../../core";
import "./SeasonsTracker.scss";

const temperatureTooltipContentMap = {
  [Temperature.Freezing]: <>Cells may freeze! Cells operate 50% slower, you walk 50% slower.</>,
  [Temperature.Cold]: <>Max sunlight at 75%. Cells operate 33% slower. You walk 33% slower.</>,
  [Temperature.Mild]: null,
  [Temperature.Hot]: <>Cells operate 25% faster, you walk 25% faster.</>,
  [Temperature.Scorching]: <>Cells evaporate water! Cells operate 50% faster, you walk 50% faster.</>,
};

export default function SeasonsTracker({
  time,
  season,
  temperature,
}: {
  time: number;
  season: Season;
  temperature: number;
}) {
  const temperatureName = temperatureFor(temperature);
  const temperatureTooltipContent = temperatureTooltipContentMap[temperatureName];
  const temperatureElement =
    temperatureTooltipContent != null ? (
      <Tooltip content={temperatureTooltipContent}>
        <div className={classNames("temperature-label", temperatureName)}>
          °{temperature.toFixed(0)} - {temperatureName}
        </div>
      </Tooltip>
    ) : (
      <div className={classNames("temperature-label", temperatureName)}>°{temperature.toFixed(0)}</div>
    );
  return (
    <div className="seasons-tracker">
      <div className="season-display">
        {season.year > 0 ? <>Year {season.year + 1}, </> : null}
        {SEASON_NAMES[season.season]}, Month {season.month}
        <br />
        Day {season.day}
        <br />
        {temperatureElement}
      </div>
    </div>
  );
}
