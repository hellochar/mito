import { Tooltip } from "@blueprintjs/core";
import { Temperature, temperatureFor } from "core/temperature";
import { Tile } from "core/tile";
import { map } from "math";
import * as React from "react";
import "./TemperatureGauge.scss";

const COLOR_FOR_TEMPERATURE: Record<Temperature, string> = {
  Freezing: "darkblue",
  Cold: "lightblue",
  Mild: "lightgray",
  Hot: "orange",
  Scorching: "red",
};

const TemperatureGauge: React.FC<{ tile: Tile }> = ({ tile }) => {
  const size = 30;

  const temperatureScaleElements: JSX.Element[] = [];
  for (let tempBarLow = 0; tempBarLow < 32 * 3; tempBarLow += 32 / 3) {
    const tempBarHigh = tempBarLow + 32 / 3;
    const tempBarMid = (tempBarLow + tempBarHigh) / 2;
    const midAngle = map(tempBarMid, 0, 96, -210, 30);
    const div = (
      <div
        key={midAngle}
        className="temperature-scale"
        style={{
          transform: `rotate(${midAngle}deg)`,
          borderRight: `${size / 4}px solid ${COLOR_FOR_TEMPERATURE[temperatureFor(tempBarMid)]}`,
        }}
      />
    );
    temperatureScaleElements.push(div);
  }

  const tempAngle = map(tile.temperatureFloat, 0, 96, -210, 30);
  return (
    <Tooltip
      content={
        <>
          <b>Temperature</b> seeps into your Cells from the outside.
        </>
      }
    >
      <div className="temperature-gauge">
        <div style={{ width: size, height: size }}>
          {temperatureScaleElements}
          <div className="temperature-pointer" style={{ transform: `rotate(${tempAngle}deg)` }}></div>
          <div className="temperature-label">°{tile.temperatureFloat.toFixed(0)}</div>
        </div>
      </div>
    </Tooltip>
  );
};

export default TemperatureGauge;
