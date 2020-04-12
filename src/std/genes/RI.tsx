import { ResourceIcon, ResourceIconProps } from "game/ui/common/ResourceIcon";
import React from "react";

const RI: React.FC<ResourceIconProps> = (props) => {
  return (
    <span className="ri">
      <ResourceIcon {...props} />
    </span>
  );
};

export default RI;
