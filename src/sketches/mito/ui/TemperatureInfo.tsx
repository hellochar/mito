import * as React from "react";
import { Temperature } from "../game/temperature";
import { Tile } from "../game/tile";

const TemperatureInfo: React.FC<{ tile: Tile }> = ({ tile }) => {
  return (
    <div className="info-tile-temperature">
      {/* {tile.temperature} ({tile.temperatureFloat.toFixed(0)} °F) */}
      <div style={{ width: 200, height: "1.15em", border: "1px solid grey", position: "relative" }}>
        <Bar left={`${(32 / 100) * 100}%`} color="lightblue" />
        <Text left={0} fontWeight={tile.temperature === Temperature.Cold ? "bold" : "normal"}>
          {Temperature.Cold}
        </Text>
        <Bar left={`${(64 / 100) * 100}%`} color="orange" />
        <Text left={`${(32 / 100) * 100}%`} fontWeight={tile.temperature === Temperature.Mild ? "bold" : "normal"}>
          {Temperature.Mild}
        </Text>
        <Text left={`${(64 / 100) * 100}%`} fontWeight={tile.temperature === Temperature.Hot ? "bold" : "normal"}>
          {Temperature.Hot}
        </Text>
        <Bar left={`${(tile.temperatureFloat / 100) * 100}%`} color="black" width={3}></Bar>
        <div
          style={{
            position: "absolute",
            left: `${(tile.temperatureFloat / 100) * 100}%`,
            transform: "translateX(-50%)",
            top: "-1.5em",
            textAlign: "center",
            fontSize: 12,
            fontWeight: "bold",
            fontFamily: "Arial",
          }}
        >
          {tile.temperatureFloat.toFixed(0)} °F
        </div>
      </div>
    </div>
  );
};

export default TemperatureInfo;

function Bar({ color = "black", left = 0 as number | string, width = 3 }) {
  return (
    <div
      style={{
        position: "absolute",
        top: -1,
        left,
        width: 1,
        bottom: 0,
        borderRight: `${width}px solid ${color}`,
      }}
    />
  );
}

function Text({
  children,
  fontWeight = "normal",
  left,
}: {
  children: React.ReactNode;
  fontWeight: React.CSSProperties["fontWeight"];
  left: number | string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        width: `${(32 / 100) * 100}%`,
        textAlign: "center",
        fontSize: 12,
        fontWeight: fontWeight,
        fontFamily: "Arial",
      }}
    >
      {children}
    </div>
  );
}
