import classnames from "classnames";
import * as React from "react";

import Mito from "../index";
import { params } from "../params";
import CellBar from "./CellBar";

import TraitDisplay from "../../../evolution/TraitDisplay";
import DynamicNumber from "common/DynamicNumber";
import { isInteresting } from "evolution/traits";
import "./HUD.scss";

import SeasonsTracker from "./SeasonsTracker";

export interface HUDProps {
  mito: Mito;
}

export interface HUDState {
  traitsPanelOpen: boolean;
}

export class HUD extends React.Component<HUDProps, HUDState> {
  state: HUDState = {
    traitsPanelOpen: true,
  };

  get mito() {
    return this.props.mito;
  }

  get world() {
    return this.mito.world;
  }

  get player() {
    return this.world.player;
  }

  get inventory() {
    return this.player.inventory;
  }

  private isTutorialFinished() {
    return this.mito.tutorialRef == null ? true : this.mito.tutorialRef.isFinished();
  }

  public render() {
    const isMaxed = this.inventory.isMaxed();
    const isMaxedEl = <div className={`mito-inventory-maxed${isMaxed ? " is-maxed" : ""}`}>maxed</div>;
    return (
      <>
        <SeasonsTracker time={this.world.time} season={this.world.season} />
        {this.maybeRenderTraits()}
        <div className={classnames("mito-inventory", { hidden: false })}>
          {isMaxedEl}
          <div className="mito-inventory-container">
            {this.renderInventoryBar()}
            {this.renderInventory()}
          </div>
          <CellBar
            bar={this.mito.cellBar}
            index={this.mito.cellBarIndex}
            onIndexClicked={(i) => this.mito.setCellBarIndex(i)}
          />
        </div>
      </>
    );
  }

  maybeRenderTraits() {
    if (this.state.traitsPanelOpen && isInteresting(this.world.traits)) {
      return (
        <div className="hud-panel-right">
          <TraitDisplay traits={this.world.traits} />
        </div>
      );
    }
  }

  renderInventory() {
    return (
      <div className="mito-inventory-indicator">
        <span className="mito-inventory-water">
          <DynamicNumber speed={0.5} value={this.inventory.water} /> water
        </span>
        &nbsp;
        <span className="mito-inventory-sugar">
          <DynamicNumber speed={0.5} value={this.inventory.sugar} /> sugar
        </span>
      </div>
    );
  }

  renderInventoryBar() {
    const waterPercent = this.inventory.water / params.maxResources;
    const sugarPercent = this.inventory.sugar / params.maxResources;
    const emptyPercent = 1 - (this.inventory.water + this.inventory.sugar) / params.maxResources;
    const waterStyles: React.CSSProperties = {
      width: `${waterPercent * 100}%`,
    };
    const sugarStyles: React.CSSProperties = {
      width: `${sugarPercent * 100}%`,
    };
    const emptyStyles: React.CSSProperties = {
      width: `${emptyPercent * 100}%`,
    };
    const inventoryBar = (
      <div className="mito-inventory-bar">
        <div style={waterStyles} className="mito-inventory-bar-water"></div>
        <div style={sugarStyles} className="mito-inventory-bar-sugar"></div>
        <div style={emptyStyles} className="mito-inventory-bar-empty"></div>
      </div>
    );
    return inventoryBar;
  }
}
