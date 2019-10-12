import React, { useState } from "react";

import "./Expand.scss";
import classNames from "classnames";

interface ExpandProps {
  className?: string;
  children: React.ReactNode;
  shrunkElements: React.ReactNode;
}

function Expand({ className, children, shrunkElements }: ExpandProps) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={classNames(className, "expand")}>
      <div className="expand-button" onClick={handleExpandClick}>
        {shrunkElements}
        <div className="expand-caret">{expanded ? "▼" : "▶"}</div>
      </div>
      {expanded ? <div>{children}</div> : null}
    </div>
  );
}

export default Expand;
