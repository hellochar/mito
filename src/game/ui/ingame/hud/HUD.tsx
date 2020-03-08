import classnames from "classnames";
import { WorldDOMComponent } from "game/mito/WorldDOMElement";
import { Button } from "game/ui/common/Button";
import * as React from "react";
import uuid from "uuid";
import { getDecidedGameResult } from "../../../gameResult";
import { PlayerSeedControlScheme } from "../../../input/ControlScheme";
import Mito from "../../../mito/mito";
import GenomeViewer from "../GenomeViewer";
import { HotkeyButton } from "../HotkeyButton";
import { InventoryBar } from "../InventoryBar";
import { TileDetails } from "../TileDetails";
import "./HUD.scss";
import SeasonsTracker from "./SeasonsTracker";
import { ToolBarUI } from "./ToolBarUI";

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
    window.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
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
        {this.maybeRenderInvalidAction()}
        <div className={classnames("hud-bottom-right", { hidden: !showPlayerHUD })}>
          <TileDetails tile={this.mito.getHighlightedTile()} />
          <div className="player-inventory-container">
            {isMaxedEl}
            <InventoryBar
              water={this.inventory.water}
              sugar={this.inventory.sugar}
              capacity={this.inventory.capacity}
              format="icons"
              className="player-inventory-bar"
            />
          </div>
          <ToolBarUI bar={this.mito.actionBar} />
          {/* <SwitchableBarUI bar={this.mito.actionBar} /> */}
          {/* <CellBarUI
            bar={this.mito.actionBar.buildBar}
            disabled={this.mito.world.player.getBuildError() || (Keyboard.isAltHeld() ? true : undefined)}
          /> */}
        </div>
        {this.maybeRenderCellInspector()}
      </>
    );
  }

  private positionFn = () => {
    return this.mito.inspectedCell ?? null;
  };

  maybeRenderCellInspector() {
    const cell = this.mito.inspectedCell;
    if (cell != null) {
      return (
        // <ReactModal
        //   isOpen
        //   ariaHideApp={false}
        //   shouldCloseOnEsc
        //   shouldCloseOnOverlayClick
        //   onRequestClose={() => {
        //     this.mito.inspectedCell = undefined;
        //   }}
        // >
        <WorldDOMComponent mito={this.mito} positionFn={this.positionFn}>
          <div className="tile-modal">
            {/* <TileDetails tile={cell} /> */}
            <div>
              <h3>{cell.displayName}</h3>
            </div>
            <div className="buttons" style={{ display: "flex" }}>
              <button
                onClick={
                  () => cell.inventory.give(this.player.inventory, 1, 0)
                  // this.player.setAction({
                  //   type: "pickup",
                  //   sugar: 0,
                  //   water: PLAYER_INTERACT_EXCHANGE_SPEED,
                  //   target: cell,
                  // })
                }
              >
                +1 water
              </button>
              <button
                onClick={
                  () => this.player.inventory.give(cell.inventory, 1, 0)
                  // this.player.setAction({
                  //   type: "drop",
                  //   sugar: 0,
                  //   water: PLAYER_INTERACT_EXCHANGE_SPEED,
                  //   target: cell,
                  // })
                }
              >
                -1 water
              </button>
              <button
                onClick={
                  () => cell.inventory.give(this.player.inventory, 0, 1)
                  // this.player.setAction({
                  //   type: "pickup",
                  //   water: 0,
                  //   sugar: PLAYER_INTERACT_EXCHANGE_SPEED,
                  //   target: cell,
                  // })
                }
              >
                +1 sugar
              </button>
              <button
                onClick={
                  () => this.player.inventory.give(cell.inventory, 0, 1)
                  // this.player.setAction({
                  //   type: "drop",
                  //   water: 0,
                  //   sugar: PLAYER_INTERACT_EXCHANGE_SPEED,
                  //   target: cell,
                  // })
                }
              >
                -1 sugar
              </button>
              <button onClick={() => this.player.setAction({ type: "deconstruct", position: cell.pos })}>
                deconstruct
              </button>
            </div>
            {/* <div>
              {cell.geneInstances.map((inst, index) => {
                const stateElements: JSX.Element[] = [];
                for (const key in inst.props) {
                  stateElements.push(
                    <div key={key}>
                      {key}: {JSON.stringify(inst.props[key])}
                    </div>
                  );
                }
                for (const key in inst.state) {
                  stateElements.push(
                    <div key={key}>
                      {key}: {JSON.stringify(inst.state[key])}
                    </div>
                  );
                }
                return (
                  <div style={{ marginBottom: 10 }}>
                    {inst.blueprint.name}
                    <div style={{ color: "grey", marginLeft: 10, fontSize: "0.8em" }}>{stateElements}</div>
                  </div>
                );
              })}
            </div> */}
          </div>
        </WorldDOMComponent>
      );
    }
  }

  maybeRenderInvalidAction() {
    const invalidAction = this.mito.invalidAction;
    if (invalidAction != null) {
      return <InvalidActionMessage invalidAction={invalidAction} />;
    }
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
    const result = getDecidedGameResult(this.mito);
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

const InvalidActionMessage: React.FC<{ invalidAction: { message: string } }> = React.memo(({ invalidAction }) => {
  // get new id on every render (aka reference equal invalidAction)
  // to trigger animation each time
  const id = uuid();
  return (
    <div className="hud-below-center">
      <div className="invalid-action" key={id}>
        {invalidAction.message}
      </div>
    </div>
  );
});
