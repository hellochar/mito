import React from "react";
import { Traits, TRAIT_NAMES } from "./traits";
import Expand from "../common/Expand";

function TraitDisplay({ traits }: { traits: Traits }) {
  const interestingTraits = TRAIT_NAMES.filter((name) => traits[name] !== 0);
  const uninterestingTraits = TRAIT_NAMES.filter((name) => traits[name] === 0);
  let children: React.ReactNode;
  if (interestingTraits.length > 0) {
    children = <>
      <div className="interesting-traits">
        {interestingTraits.map((trait) => (
          <div className="trait" key={trait}>
            {trait}: {traits[trait]}
          </div>
        ))}
      </div>
      <Expand shrunkElements={<div className="details">All Traits</div>}>
        <div className="uninteresting-traits">
          {uninterestingTraits.map((trait) => (
            <div className="trait" key={trait}>
              {trait}: {traits[trait]}
            </div>
          ))}
        </div>
      </Expand>
    </>
  } else {
    children = <div className="all-traits">
      {uninterestingTraits.map((trait) => (
        <div className="trait" key={trait}>
          {trait}: {traits[trait]}
        </div>
      ))}
    </div>
  }
  return (
    <div className="trait-display">
      {children}
    </div>
  );
}

export default TraitDisplay;
