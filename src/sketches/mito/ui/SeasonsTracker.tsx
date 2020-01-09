import * as React from "react";
import { formatTime, Season, SEASON_NAMES } from "../game";
import "./SeasonsTracker.scss";

export default function SeasonsTracker({ time, season }: { time: number; season: Season }) {
  return (
    <div className="seasons-tracker">
      <div className="season-display">
        {season.year > 0 ? <>Year {season.year + 1}, </> : null}
        {SEASON_NAMES[season.season]}
        <br />
        Month {season.month}
        <br />
        Day {season.day}
      </div>
      <div className="time">{formatTime(time)}</div>
    </div>
  );
}
