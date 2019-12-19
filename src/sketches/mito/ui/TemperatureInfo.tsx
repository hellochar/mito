import { map } from "math";
import * as React from "react";
import { Temperature, temperatureFor } from "../game/temperature";
import { Tile } from "../game/tile";

const COLOR_FOR_TEMPERATURE: Record<Temperature, string> = {
  Freezing: "darkblue",
  Cold: "lightblue",
  Mild: "lightgray",
  Hot: "orange",
  Scorching: "red",
};

const TemperatureInfo: React.FC<{ tile: Tile }> = ({ tile }) => {
  const size = 30;

  const temperatureScaleElements: JSX.Element[] = [];
  for (let tempBarLow = 0; tempBarLow < 32 * 3; tempBarLow += 32 / 3) {
    const tempBarHigh = tempBarLow + 32 / 3;
    const tempBarMid = (tempBarLow + tempBarHigh) / 2;
    const midAngle = map(tempBarMid, 0, 96, -210, 30);
    const div = (
      <div
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
    <div className="info-tile-temperature">
      <div style={{ width: size, height: size }}>
        {temperatureScaleElements}
        <div className="temperature-pointer" style={{ transform: `rotate(${tempAngle}deg)` }}></div>
        <div className="temperature-label">°F</div>
      </div>
    </div>
  );
};

export default TemperatureInfo;
