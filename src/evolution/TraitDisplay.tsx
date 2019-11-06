import React from "react";
import classNames from "classnames";

import { Traits, TRAIT_TYPES, displayName } from "./traits";
import Expand from "../common/Expand";

import "./TraitDisplay.scss";

function TraitDisplay({ traits }: { traits: Traits }) {
  const nonzeroTraits = TRAIT_TYPES.filter((name) => traits[name] !== 0);
  nonzeroTraits.sort((a, b) => traits[b] - traits[a]);
  const nonzeroTraitEl =
    nonzeroTraits.length > 0 ? (
      <div className="interesting-traits">
        {nonzeroTraits.map((trait) => (
          <div className={classNames("trait", { green: traits[trait] > 0, red: traits[trait] < 0 })} key={trait}>
            {displayName(trait)}: {traits[trait]}
          </div>
        ))}
      </div>
    ) : (
      <div className="no-interesting-traits">All traits are zero.</div>
    );

  const zeroTraits = TRAIT_TYPES.filter((name) => traits[name] === 0);
  const zeroTraitEl = (
    <div className="zero-traits">
      {zeroTraits.map((trait) => (
        <div className="trait" key={trait}>
          {displayName(trait)}: {traits[trait]}
        </div>
      ))}
    </div>
  );
  return (
    <div className="trait-display">
      {nonzeroTraitEl}
      <Expand shrunkElements={<div className="expand-toggle">Show All</div>}>{zeroTraitEl}</Expand>
    </div>
  );
}

export default TraitDisplay;
