import { Popover } from "@blueprintjs/core";
import classnames from "classnames";
import { Tile } from "core/tile";
import { WorldDOMComponent } from "game/mito/WorldDOMElement";
import { Button } from "game/ui/common/Button";
import * as React from "react";
import { DragDropContext } from "react-beautiful-dnd";
import uuid from "uuid";
import { getDecidedGameResult } from "../../../gameResult";
import { PlayerSeedControlScheme } from "../../../input/ControlScheme";
import Mito from "../../../mito/mito";
import SpeciesViewer from "../../SpeciesViewer";
import { HotkeyButton } from "../HotkeyButton";
import { InventoryBar } from "../InventoryBar";
import { TileDetails } from "../TileDetails";
import { CellInspector } from "./CellInspector";
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
    const isFirstPlaythrough = this.mito.attempt.sourceHex == null;
    return (
      <>
        {!isFirstPlaythrough ? <div className="hex-title">{this.mito.attempt.targetHex.displayName}</div> : null}
        <div className={classnames("hud-top-center", { hidden: !showPlayerHUD })}>
          <SeasonsTracker time={this.world.time} season={this.world.season} />
        </div>
        {this.maybeRenderSpeciesViewer()}
        {this.maybeRenderCollectButton()}
        {this.maybeRenderWinShine()}
        {this.maybeRenderGerminateButton()}
        {this.maybeRenderPausedUI()}
        {this.maybeRenderInvalidAction()}
        <div className={classnames("hud-bottom-right", { hidden: !showPlayerHUD })}>
          {this.mito.isPaused ? (
            this.mito.pausedInspectedTile ? null : (
              <TileDetails tile={this.mito.getTileAtScreen()} />
            )
          ) : (
            <TileDetails tile={this.mito.highlightedTile} />
          )}
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
          <ToolBarUI bar={this.mito.toolBar} />
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
          <CellInspector cell={cell} player={this.player} onDone={this.handleCellInspectorDone} />
        </WorldDOMComponent>
      );
    }
  }

  private handleCellInspectorDone = () => {
    this.mito.inspectedCell = undefined;
  };

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
            Win (+ {result.mutationPointsPerEpoch} MP per epoch)
          </Button>
        </div>
      );
    }
  }

  maybeRenderWinShine() {
    const result = getDecidedGameResult(this.mito);
    if (result.status === "won") {
      return <div className="win-shine"></div>;
    }
  }

  maybeRenderSpeciesViewer() {
    if (this.state.genomeViewerOpen) {
      return (
        <div className="hud-top">
          <DragDropContext onDragEnd={this.handleDragEnd}>
            <SpeciesViewer speciesId={this.mito.world.species.id} />
          </DragDropContext>
        </div>
      );
    }
  }

  maybeRenderPausedUI() {
    if (this.mito.isPaused) {
      const pausedInspectedTile = this.mito.pausedInspectedTile;
      const mouseInstructions =
        pausedInspectedTile == null ? (
          <div className="mouse-position" style={{ left: this.mito.mouse.position.x, top: this.mito.mouse.position.y }}>
            <span className="click-to-inspect">{pausedInspectedTile == null ? "Click to inspect." : null}</span>
          </div>
        ) : null;
      const popover =
        pausedInspectedTile != null ? <PausedTileDetailsPopover mito={this.mito} tile={pausedInspectedTile} /> : null;

      return (
        <>
          <div className="paused">Paused</div>
          {mouseInstructions}
          {popover}
        </>
      );
    }
  }

  // no-op
  private handleDragEnd = () => {};
}

const PausedTileDetailsPopover = ({ mito, tile }: { mito: Mito; tile: Tile }) => {
  const positionFn = React.useCallback(() => tile, [tile]);

  return (
    <WorldDOMComponent mito={mito} positionFn={positionFn} className="paused-popover">
      <Popover
        content={<TileDetails key={tile.toString()} tile={tile} />}
        usePortal={false}
        autoFocus={false}
        isOpen
        minimal
      >
        <span />
      </Popover>
    </WorldDOMComponent>
  );
};

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
