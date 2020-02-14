import classnames from "classnames";
import { Button } from "game/ui/common/Button";
import * as React from "react";
import { PlayerSeedControlScheme } from "../../../sketches/mito/ControlScheme";
import Mito from "../../../sketches/mito/index";
import Keyboard from "../../../sketches/mito/keyboard";
import GenomeViewer from "../../../sketches/mito/ui/GenomeViewer";
import { HotkeyButton } from "../../../sketches/mito/ui/HotkeyButton";
import { getDecidedGameResult } from "../../gameResult";
import CellBarUI from "./CellBarUI";
import "./HUD.scss";
import { InventoryBar } from "./InventoryBar";
import SeasonsTracker from "./SeasonsTracker";

export interface HUDProps {
  mito: Mito;
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
    const showPlayerHUD = this.world.playerSeed == null;
    return (
      <>
        <div className={classnames("hud-top-center", { hidden: !showPlayerHUD })}>
          <SeasonsTracker time={this.world.time} season={this.world.season} />
        </div>
        {this.maybeRenderGenomeViewer()}
        {this.maybeRenderCollectButton()}
        {this.maybeRenderGerminateButton()}
        <div className={classnames("hud-bottom", { hidden: !showPlayerHUD })}>
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
            disabled={this.mito.world.player.getBuildError() || (Keyboard.isAltHeld() ? true : undefined)}
          />
        </div>
      </>
    );
  }

  maybeRenderGerminateButton() {
    const showSeedHUD = this.world.playerSeed != null;
    const popOutFn = () => {
      const { controls } = this.mito;
      if (controls instanceof PlayerSeedControlScheme) {
        controls.popOut();
      }
    };
    if (showSeedHUD) {
      return (
        <div className="hud-germinate" onClick={popOutFn}>
          <p>Germinate</p>
          <HotkeyButton hotkey="Space" onClick={popOutFn} />
        </div>
      );
    }
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
