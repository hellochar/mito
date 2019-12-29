import classnames from "classnames";
import { isInteresting } from "evolution/traits";
import * as React from "react";
import TraitDisplay from "../../../evolution/TraitDisplay";
import Mito from "../index";
import "./HUD.scss";
import { InventoryBar } from "./InventoryBar";
import SeasonsTracker from "./SeasonsTracker";
import SwitchableBarUI from "./SwitchableBarUI";

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
        <div className={classnames("hud-bottom", { hidden: false })}>
          {isMaxedEl}
          <InventoryBar
            water={this.inventory.water}
            sugar={this.inventory.sugar}
            capacity={this.inventory.capacity}
            format="icons"
            className="player-inventory-bar"
          />
          <SwitchableBarUI bar={this.mito.actionBar} />
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
}
