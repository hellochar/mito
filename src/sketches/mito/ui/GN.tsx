import DynamicNumber, { DynamicNumberProps } from "game/ui/common/DynamicNumber";
import React from "react";

const GN: React.FC<DynamicNumberProps> = (props) => {
  return (
    <span className="gn">
      <DynamicNumber {...props} />
    </span>
  );
};

export default GN;
