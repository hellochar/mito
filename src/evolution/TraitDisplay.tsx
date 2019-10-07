import React from "react";
import classNames from "classnames";

import { Traits, TRAIT_NAMES } from "./traits";
import Expand from "../common/Expand";

import "./TraitDisplay.scss";

function TraitDisplay({ traits }: { traits: Traits }) {
  const interestingTraits = TRAIT_NAMES.filter((name) => traits[name] !== 0);
  const restTraits = TRAIT_NAMES.filter((name) => traits[name] === 0);
  const restTraitEls = restTraits.map((trait) => (
    <div className="trait" key={trait}>
      {trait}: {traits[trait]}
    </div>
  ));
  let children: React.ReactNode;
  if (interestingTraits.length > 0) {
    interestingTraits.sort((a, b) => traits[b] - traits[a]);
    children = <>
      <div className="interesting-traits">
        {interestingTraits.map((trait) => (
          <div className={classNames("trait", { green: traits[trait] > 0, red: traits[trait] < 0 })} key={trait}>
            {trait}: {traits[trait]}
          </div>
        ))}
      </div>
      <Expand shrunkElements={<div className="expand">All Traits</div>}>
        <div className="uninteresting-traits">
          {restTraitEls}
        </div>
      </Expand>
    </>
  } else {
    children = <div className="all-traits">
      {restTraitEls}
    </div>
  }
  return (
    <div className="trait-display">
      {children}
    </div>
  );
}

export default TraitDisplay;
