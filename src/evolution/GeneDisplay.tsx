import React from "react";
import { Gene } from "./gene";
import { dnaPairToTraitType } from "./traits";

import "./GeneDisplay.scss";

function GeneComponent({ gene }: { gene: Gene }) {
  return (
    <div className="gene">
      <div className="gene-number">
        <span className="tuple-plus" title={dnaPairToTraitType(gene[0]) + " +1"}>{gene[0]}</span>
        <span className="tuple-minus" title={dnaPairToTraitType(gene[1]) + " -1"}>{gene[1]}</span>
      </div>
      <div className="gene-visual"><img alt="" src="https://media2.giphy.com/media/YlmI36YAWe7KScC7hK/giphy.gif" width="44px" /></div>
    </div>
  );
}

function GeneDisplay({ genes, mutationPoints }: { genes: Gene[], mutationPoints: number }) {
  return (
    <div className="gene-display">
      <div className="genes-container">
        {genes.map((gene, i) => <GeneComponent key={i} gene={gene} />)}
      </div>
    </div>
  )
}

export default GeneDisplay;
