import { Temperature } from "core/temperature";
import * as React from "react";
import { Season, SEASON_NAMES } from "../../../../core";
import TemperatureGauge from "../TemperatureGauge";
import "./SeasonsTracker.scss";

export default function SeasonsTracker({
  time,
  season,
  temperature,
}: {
  time: number;
  season: Season;
  temperature: Temperature;
}) {
  return (
    <div className="seasons-tracker">
      <div className="season-display">
        {season.year > 0 ? <>Year {season.year + 1}, </> : null}
        {SEASON_NAMES[season.season]}, Month {season.month}
        <br />
        Day {season.day}
        <br />
        <TemperatureGauge temperature={temperature} showMild />
      </div>
    </div>
  );
}
