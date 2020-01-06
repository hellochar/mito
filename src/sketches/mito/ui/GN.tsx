import DynamicNumber from "common/DynamicNumber";
import React from "react";

const GN: React.FC<{ value: number }> = ({ value }) => {
  return (
    <span className="gn">
      <DynamicNumber speed={0.5} value={value} />
    </span>
  );
};

export default GN;
