import DynamicNumber, { DynamicNumberProps } from "common/DynamicNumber";
import React from "react";

const GN: React.FC<DynamicNumberProps> = (props) => {
  return (
    <span className="gn">
      <DynamicNumber {...props} />
    </span>
  );
};

export default GN;
