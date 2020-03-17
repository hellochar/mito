import React from "react";
import { CellInteraction, describeCellInteraction } from "../../../core/cell/genome";

export const CellInteractionSelector: React.FC<{
  interaction?: CellInteraction;
  setInteraction: (i: CellInteraction | undefined) => void;
}> = React.memo(({ interaction, setInteraction }) => {
  const handleSelect = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const indexOrUndefined = event.target.value;
      if (indexOrUndefined == null) {
        setInteraction(undefined);
        // cellType.interaction = undefined;
      } else {
        setInteraction(possibleInteractions[Number(indexOrUndefined)]);
        // cellType.interaction = possibleInteractions[Number(indexOrUndefined)];
      }
    },
    [setInteraction]
  );
  const selectValue =
    interaction == null
      ? undefined
      : possibleInteractions.findIndex((i) => interaction.resources === i.resources && interaction.type === i.type);
  const interactionEl = (
    <select className="interaction-select" onChange={handleSelect} value={selectValue}>
      <option value={undefined}>do nothing</option>
      {possibleInteractions.map((interaction, index) => {
        return (
          <option key={index} value={index}>
            {describeCellInteraction(interaction)}
          </option>
        );
      })}
    </select>
  );
  return <div className="interaction-select-container">Left-click to {interactionEl}.</div>;
});

const interactionTypes = ["give", "take"] as const;
const resourceTypes = ["water", "sugar", "water and sugar"] as const;
export const possibleInteractions: CellInteraction[] = interactionTypes.flatMap((type) =>
  resourceTypes.map((resources) => ({
    type,
    resources,
  }))
);
possibleInteractions.push(
  {
    type: "give",
    resources: "water take sugar",
  },
  {
    type: "give",
    resources: "sugar take water",
  }
);
