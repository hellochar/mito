import React from "react";
import { Gene } from "./gene";
import "./GeneDisplay.scss";
import { tupleToTrait } from "./traits";

function GeneComponent({ gene, onClick }: { gene: Gene; onClick: (position: number) => void }) {
  return (
    <div className="gene">
      <div className="gene-number">
        <span className="tuple-plus" title={tupleToTrait(gene[0]) + " +1"}>
          <span className="dna" onClick={() => onClick(0)}>
            {gene[0][0]}
          </span>
          <span className="dna" onClick={() => onClick(1)}>
            {gene[0][1]}
          </span>
        </span>
        <span className="tuple-minus" title={tupleToTrait(gene[1]) + " -1"}>
          <span className="dna" onClick={() => onClick(2)}>
            {gene[1][0]}
          </span>
          <span className="dna" onClick={() => onClick(3)}>
            {gene[1][1]}
          </span>
        </span>
      </div>
      <div className="gene-visual">
        <img alt="" src="https://media2.giphy.com/media/YlmI36YAWe7KScC7hK/giphy.gif" width="44px" />
      </div>
    </div>
  );
}

export interface GeneDisplayProps {
  genes: Gene[];
  onClick: (gene: Gene, position: number) => void;
}

function GeneDisplay({ genes, onClick }: GeneDisplayProps) {
  const geneContent =
    genes.length > 0 ? (
      <div className="genes-container">
        {genes.map((gene, i) => (
          <GeneComponent key={i} gene={gene} onClick={(p) => onClick(gene, p)} />
        ))}
      </div>
    ) : (
      <div className="genes-empty">No genes.</div>
    );
  return <div className="gene-display">{geneContent}</div>;
}

export default GeneDisplay;
