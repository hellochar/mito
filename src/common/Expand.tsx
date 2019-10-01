import React, { useState } from "react";

import "./Expand.scss";

interface ExpandProps {
  children: React.ReactNode;
  shrunkElements: React.ReactNode;
}

function Expand({ children, shrunkElements }: ExpandProps) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div>
      <div className="expand-button" onClick={handleExpandClick}>
        {shrunkElements}
        <div className="expand-caret">
          {expanded ? "▼" : "▶" }
        </div>
      </div>
      {expanded ? <div>{children}</div> : null}
    </div>
  );
}

export default Expand;
