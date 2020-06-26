import React, { useCallback } from "react";
import { CellInteraction, describeCellInteraction } from "../../../core/cell/genome";

export const CellInteractionSelector: React.FC<{
  interaction?: CellInteraction;
  setInteraction: (i: CellInteraction | undefined) => void;
}> = React.memo(({ interaction, setInteraction }) => {
  const handleSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const indexOrUndefined = event.target.value;
      if (indexOrUndefined == null) {
        setInteraction(undefined);
        // cellType.interaction = undefined;
      } else {
        const newInteraction = possibleInteractions[Number(indexOrUndefined)];
        if (interaction == null) {
          setInteraction(ensureValidatedInteraction(newInteraction));
        } else {
          setInteraction(
            ensureValidatedInteraction({
              ...newInteraction,
              continuous: interaction.continuous,
            })
          );
        }
      }
    },
    [interaction, setInteraction]
  );

  const handleChangeContinuous = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (interaction != null) {
        setInteraction(
          ensureValidatedInteraction({
            ...interaction,
            continuous: event.target.checked,
          })
        );
      }
    },
    [interaction, setInteraction]
  );
  let selectValue =
    interaction == null
      ? undefined
      : possibleInteractions.findIndex((i) => interaction.resources === i.resources && interaction.type === i.type);
  if (selectValue === -1) {
    selectValue = undefined;
  }
  const interactionEl = (
    <select className="interaction-select" onChange={handleSelect} defaultValue={String(selectValue)}>
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

  const continuousEl =
    interaction != null ? (
      <label>
        <input type="checkbox" checked={interaction.continuous} onChange={handleChangeContinuous} /> continuously.
      </label>
    ) : null;
  return (
    <form className="interaction-select-container">
      <label>Left-click to {interactionEl}.</label>
      {continuousEl}
    </form>
  );
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

function ensureValidatedInteraction(interaction: CellInteraction | undefined): CellInteraction | undefined {
  if (interaction == null) {
    return undefined;
  }
  const index = possibleInteractions.findIndex(
    (i) => interaction.resources === i.resources && interaction.type === i.type
  );
  if (index === -1) {
    return undefined;
  } else {
    return interaction;
  }
}
