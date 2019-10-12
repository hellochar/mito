import React from "react";
import TraitDisplay from "./TraitDisplay";
import { getTraits } from "./traits";
import GeneDisplay, { GeneDisplayProps } from "./GeneDisplay";

import "./GenesToTraits.scss";

import { Gene } from "./gene";

export interface GenesToTraitsProps {
  genes: Gene[];
  onClick: GeneDisplayProps["onClick"];
}

function GenesToTraits({ genes, onClick }: GenesToTraitsProps) {
  const traits = React.useMemo(() => {
    return getTraits(genes);
  }, [genes]);

  return (
    <div className="genes-to-traits">
      <div className="genes-details">
        <h3>Genes</h3>
        <GeneDisplay genes={genes} onClick={onClick} />
      </div>
      <div className="arrow">⇒</div>
      <div className="traits-details">
        <h3>Traits</h3>
        <TraitDisplay traits={traits} />
      </div>
    </div>
  );
}

export default GenesToTraits;
