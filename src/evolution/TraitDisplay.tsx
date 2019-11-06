import classNames from "classnames";
import React from "react";
import Expand from "../common/Expand";
import "./TraitDisplay.scss";
import { displayName, Traits, traitToTuple, TraitType, TraitValue, TRAIT_TYPES } from "./traits";

function Trait({ name, value }: { name: TraitType; value: TraitValue }) {
  return (
    <div className={classNames("trait", { green: value > 0, red: value < 0 })}>
      <span className="tuple">{traitToTuple(name)}</span> {displayName(name)}: {value}
    </div>
  );
}

interface TraitDisplayProps {
  traits: Traits;
}

function sortNames(traits: Traits, names: TraitType[]) {
  // sort values first, then alphabetically
  names.sort((a, b) => (traits[b] - traits[a]) * 1000 + traitToTuple(a).localeCompare(traitToTuple(b)));
  return names;
}

function TraitDisplay({ traits }: TraitDisplayProps) {
  const nonzeroTraits = sortNames(traits, TRAIT_TYPES.filter((name) => traits[name] !== 0));
  const nonzeroTraitElements =
    nonzeroTraits.length > 0 ? (
      <div className="interesting-traits">
        {nonzeroTraits.map((trait) => (
          <Trait key={trait} name={trait} value={traits[trait]} />
        ))}
      </div>
    ) : (
      <div className="no-interesting-traits">All traits are zero.</div>
    );

  const zeroTraits = sortNames(traits, TRAIT_TYPES.filter((name) => traits[name] === 0));
  const zeroTraitElements = (
    <div className="zero-traits">
      {zeroTraits.map((trait) => (
        <Trait key={trait} name={trait} value={traits[trait]} />
      ))}
    </div>
  );
  return (
    <div className="trait-display">
      {nonzeroTraitElements}
      <Expand shrunkElements={<div className="expand-toggle">Show All</div>}>{zeroTraitElements}</Expand>
    </div>
  );
}

export default TraitDisplay;
