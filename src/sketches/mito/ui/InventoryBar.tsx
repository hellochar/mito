import classNames from "classnames";
import DynamicNumber from "game/ui/common/DynamicNumber";
import * as React from "react";
import "./InventoryBar.scss";
import { ResourceIcon } from "./ResourceIcon";

export const InventoryBar: React.FC<{
  water: number;
  sugar: number;
  capacity: number;
  format: "text" | "icons";
  colored?: boolean;
  capacityBasedWidth?: boolean;
  className?: string;
}> = React.memo(({ water, sugar, capacity, className, colored = true, format, capacityBasedWidth }) => {
  if (capacity === 0) {
    return null;
  }
  const waterPercent = water / capacity;
  const sugarPercent = sugar / capacity;
  const emptyPercent = 1 - (water + sugar) / capacity;
  const waterStyles: React.CSSProperties = {
    width: `${waterPercent * 100}%`,
  };
  const sugarStyles: React.CSSProperties = {
    width: `${sugarPercent * 100}%`,
  };
  const emptyStyles: React.CSSProperties = {
    width: `${emptyPercent * 100}%`,
  };
  const textElements =
    format === "text" ? (
      <>
        <span className="text water">
          <DynamicNumber speed={0.5} value={water} /> water
        </span>
        &nbsp;
        <span className="text sugar">
          <DynamicNumber speed={0.5} value={sugar} /> sugar
        </span>
      </>
    ) : (
      <>
        {water > 0 ? (
          <span className="text water">
            {sugar > 0 ? <ResourceIcon name="water" /> : null} <DynamicNumber speed={0.5} value={water} />
          </span>
        ) : null}
        {sugar > 0 ? (
          <span className="text sugar">
            <ResourceIcon name="sugar" /> <DynamicNumber speed={0.5} value={sugar} />
          </span>
        ) : null}
      </>
    );

  const barStyles: React.CSSProperties = {
    width: capacityBasedWidth ? 10 * capacity : undefined,
  };

  return (
    <div className={classNames("inventory-bar-container", className)}>
      <div className="inventory-bar" style={barStyles}>
        <div style={waterStyles} className="bar-water"></div>
        <div style={sugarStyles} className="bar-sugar"></div>
        <div style={emptyStyles} className="bar-empty"></div>
        {capacityBasedWidth ? <div className="markers" /> : null}
      </div>
      <div className={classNames("inventory-text", { colored })}>{textElements}</div>
    </div>
  );
});
