import classNames from "classnames";
import { nf } from "common/formatters";
import { WorldDOMComponent } from "game/mito/WorldDOMElement";
import { Button } from "game/ui/common/Button";
import * as React from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { getDecidedGameResult } from "../../../gameResult";
import { PlayerSeedControlScheme } from "../../../input/ControlScheme";
import Mito from "../../../mito/mito";
import SpeciesViewer from "../../SpeciesViewer";
import { HotkeyButton } from "../HotkeyButton";
import { InventoryBar } from "../InventoryBar";
import { TileDetails } from "../TileDetails";
import { CellInspector } from "./CellInspector";
import { GameMenu } from "./GameMenu";
import "./HUD.scss";
import { InvalidActionMessage } from "./InvalidActionMessage";
import { PausedTileDetailsPopover } from "./PausedTileDetailsPopover";
import SeasonsTracker from "./SeasonsTracker";
import { ToolBarUI } from "./ToolBarUI";
import { Tutorial } from "./Tutorial";

export interface HUDProps {
  mito: Mito;
}

export interface HUDState {
  isViewerOpen: boolean;
}

export class HUD extends React.Component<HUDProps, HUDState> {
  state: HUDState = {
    isViewerOpen: false,
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

  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Tab") {
      this.setState({
        isViewerOpen: !this.state.isViewerOpen,
      });
    }
  };

  public render() {
    const isMaxed = this.inventory.isMaxed();
    const isMaxedEl = <div className={`mito-inventory-maxed${isMaxed ? " is-maxed" : ""}`}>maxed</div>;
    const showPlayerHUD = this.world.playerSeed == null;
    const isFirstPlaythrough = this.mito.isFirstPlaythrough;
    return (
      <>
        {!isFirstPlaythrough ? <div className="hex-title">{this.mito.attempt.targetHex.displayName}</div> : null}
        <div className={classNames("hud-top-center")}>
          <SeasonsTracker
            time={this.world.time}
            season={this.world.season}
            temperature={this.world.weather.getCurrentTemperature()}
          />
          <div className="oxygen-rate">{nf(this.world.oxygenPerSecond, 3)} Oxygen per second</div>
        </div>
        <GameMenu {...this.props} />
        {this.maybeRenderSpeciesViewer()}
        <div className="hud-right-of-time">{this.maybeRenderWinButton()}</div>
        {this.maybeRenderWinShine()}
        {this.maybeRenderGerminateButton()}
        {this.maybeRenderPausedUI()}
        {this.maybeRenderInvalidAction()}
        {this.maybeRenderTutorial()}
        <div className={classNames("hud-bottom-right", { hidden: !showPlayerHUD })}>
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

  maybeRenderWinButton() {
    const result = getDecidedGameResult(this.mito);
    if (result.status === "won") {
      return (
        <Button color="purple" onClick={() => this.mito.onWinLoss(result)}>
          Win (+ {result.mutationPointsPerEpoch} MP per epoch)
        </Button>
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
    if (this.state.isViewerOpen) {
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

  maybeRenderTutorial() {
    const showPlayerHUD = this.world.playerSeed == null;
    if (this.mito.isFirstPlaythrough && showPlayerHUD) {
      return <Tutorial {...this.props} isViewerOpen={this.state.isViewerOpen} />;
    }
  }

  // no-op
  private handleDragEnd = () => {};
}

export function useHotkey(key: string, action: (event: KeyboardEvent) => void) {
  React.useEffect(() => {
    const cb = (event: KeyboardEvent) => {
      if (key === event.code) {
        action(event);
      }
    };
    window.addEventListener("keyup", cb);
    return () => {
      window.removeEventListener("keyup", cb);
    };
  }, [action, key]);
}
