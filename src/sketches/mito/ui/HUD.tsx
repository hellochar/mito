import classnames from "classnames";
import { Button } from "common/Button";
import { isInteresting } from "evolution/traits";
import * as React from "react";
import TraitDisplay from "../../../evolution/TraitDisplay";
import { getDecidedGameResult } from "../game/gameResult";
import Mito from "../index";
import Input from "../input";
import CellBarUI from "./CellBarUI";
import GenomeViewer from "./GenomeViewer";
import "./HUD.scss";
import { InventoryBar } from "./InventoryBar";
import SeasonsTracker from "./SeasonsTracker";

export interface HUDProps {
  mito: Mito;
  show: boolean;
}

export interface HUDState {
  traitsPanelOpen: boolean;
  genomeViewerOpen: boolean;
}

export class HUD extends React.Component<HUDProps, HUDState> {
  state: HUDState = {
    traitsPanelOpen: true,
    genomeViewerOpen: false,
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

  componentDidMount() {
    this.mito.eventEmitter.on("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Tab") {
      this.setState({
        genomeViewerOpen: !this.state.genomeViewerOpen,
      });
    }
  };

  public render() {
    const isMaxed = this.inventory.isMaxed();
    const isMaxedEl = <div className={`mito-inventory-maxed${isMaxed ? " is-maxed" : ""}`}>maxed</div>;
    return (
      <>
        <div className="hud-top-center">
          <SeasonsTracker time={this.world.time} season={this.world.season} />
        </div>
        {this.maybeRenderTraits()}
        {this.maybeRenderGenomeViewer()}
        {this.maybeRenderCollectButton()}
        <div className={classnames("hud-bottom", { hidden: !this.props.show })}>
          {isMaxedEl}
          <InventoryBar
            water={this.inventory.water}
            sugar={this.inventory.sugar}
            capacity={this.inventory.capacity}
            format="icons"
            className="player-inventory-bar"
          />
          {/* <SwitchableBarUI bar={this.mito.actionBar} /> */}
          <CellBarUI
            bar={this.mito.actionBar.buildBar}
            disabled={this.mito.world.player.getBuildError() || (Input.isAltHeld() ? true : undefined)}
          />
        </div>
      </>
    );
  }

  maybeRenderCollectButton() {
    const result = getDecidedGameResult(this.world);
    if (result.status === "won") {
      return (
        <div className="hud-right-of-time">
          <Button color="purple" onClick={() => this.mito.onWinLoss(result)}>
            Win (+ {result.mutationPointsPerEpoch} MP)
          </Button>
        </div>
      );
    }
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

  maybeRenderGenomeViewer() {
    if (this.state.genomeViewerOpen) {
      return (
        <div className="hud-top">
          <GenomeViewer genome={this.mito.world.genome} />
        </div>
      );
    }
  }
}
