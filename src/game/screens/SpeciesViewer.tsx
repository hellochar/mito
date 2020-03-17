import { Species } from "core/species";
import MP from "game/ui/common/MP";
import GenomeViewer from "game/ui/GenomeViewer";
import React from "react";
import "./SpeciesViewer.scss";
export const SpeciesViewer: React.FC<{
  species: Species;
}> = ({ species }) => {
  return (
    <div className="species-viewer">
      <div className="header">
        <div className="species-name">{species.name}</div>
        - <MP amount={species.freeMutationPoints} /> of <MP amount={species.totalMutationPoints} />
      </div>
      <GenomeViewer genome={species.genome} />
    </div>
  );
};
