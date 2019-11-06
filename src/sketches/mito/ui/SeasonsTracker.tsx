import * as React from "react";

import { TIME_PER_YEAR, Season, seasonDisplay } from "../game";
import "./SeasonsTracker.scss";

export default function SeasonsTracker({ time, season }: { time: number; season: Season }) {
  const yearDonePercent = time / TIME_PER_YEAR;
  return (
    <div className="seasons-tracker">
      <div className="container">
        <div className="end-brace" />
        <div className="bar">
          <BarMarker percent={0.25} />
          <BarMarker percent={0.5} />
          <BarMarker percent={0.75} />
          <SeasonBead percent={yearDonePercent} />
        </div>
        <div className="end-brace" />
      </div>
      <div className="season-display">{seasonDisplay(season)}</div>
    </div>
  );
}

function BarMarker({ percent }: { percent: number }) {
  const style = {
    left: `${(percent * 100).toFixed(2)}%`,
  };
  return <div className="bar-marker" style={style} />;
}

function SeasonBead({ percent }: { percent: number }) {
  const style = {
    left: `${(percent * 100).toFixed(2)}%`,
  };
  return <div className="season-bead" style={style} />;
}
