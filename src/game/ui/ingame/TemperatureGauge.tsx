import { Tooltip } from "@blueprintjs/core";
import classNames from "classnames";
import { Temperature } from "core/temperature";
import * as React from "react";
import "./TemperatureGauge.scss";

const tooltipMap = {
  [Temperature.Freezing]: <>Cells may freeze! Sunlight at 50%. Cells operate 50% slower. You walk 50% slower.</>,
  [Temperature.Cold]: <>Sunlight at 75%. Cells operate 33% slower. You walk 33% slower.</>,
  [Temperature.Mild]: <>No effect from temperature.</>,
  [Temperature.Hot]: <>Sunlight at 125%. Cells operate 25% faster. You walk 25% faster.</>,
  [Temperature.Scorching]: <>Cells evaporate water! Sunlight at 150%. Cells operate 50% faster. You walk 50% faster.</>,
};

const TemperatureGauge: React.FC<{ temperature: Temperature; showMild?: boolean }> = ({
  temperature,
  showMild = false,
}) => {
  const name = Temperature[temperature];
  if (!showMild && temperature === Temperature.Mild) {
    return null;
  } else {
    const tooltipContent = tooltipMap[temperature];
    return (
      <Tooltip content={tooltipContent}>
        <div className={classNames("temperature-gauge", name.toLowerCase())}>{name}</div>
      </Tooltip>
    );
  }
};

export default TemperatureGauge;
