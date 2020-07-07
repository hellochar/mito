import { Tooltip } from "@blueprintjs/core";
import classNames from "classnames";
import { Temperature } from "core/temperature";
import * as React from "react";
import "./TemperatureGauge.scss";

const temperatureTooltipContentMap = {
  [Temperature.Freezing]: <>Cells may freeze! Cells operate 50% slower, you walk 50% slower.</>,
  [Temperature.Cold]: <>Max sunlight at 75%. Cells operate 33% slower. You walk 33% slower.</>,
  [Temperature.Mild]: <>Temperature changes will affect your cells.</>,
  [Temperature.Hot]: <>Cells operate 25% faster, you walk 25% faster.</>,
  [Temperature.Scorching]: <>Cells evaporate water! Cells operate 50% faster, you walk 50% faster.</>,
};

const TemperatureGauge: React.FC<{ temperature: Temperature; showMild?: boolean }> = ({
  temperature,
  showMild = false,
}) => {
  const name = Temperature[temperature];
  if (!showMild && temperature === Temperature.Mild) {
    return null;
  } else {
    const tooltipContent = temperatureTooltipContentMap[temperature];
    return (
      <Tooltip content={tooltipContent}>
        <div className={classNames("temperature-gauge", name.toLowerCase())}>{name}</div>
      </Tooltip>
    );
  }
};

export default TemperatureGauge;
