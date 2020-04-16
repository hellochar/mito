import { Popover } from "@blueprintjs/core";
import classNames, { default as classnames } from "classnames";
import { Player, StepStats } from "core";
import { Action } from "core/player/action";
import { Cell, Tile } from "core/tile";
import { EventPhotosynthesis } from "core/tile/tileEvent";
import { WorldDOMComponent } from "game/mito/WorldDOMElement";
import { Button } from "game/ui/common/Button";
import * as React from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { GeneSeed } from "std/genes";
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
    const isFirstPlaythrough = this.mito.isFirstPlaythrough;
    return (
      <>
        {!isFirstPlaythrough ? <div className="hex-title">{this.mito.attempt.targetHex.displayName}</div> : null}
        <div className={classnames("hud-top-center", { hidden: !showPlayerHUD })}>
          <SeasonsTracker
            time={this.world.time}
            season={this.world.season}
            temperature={this.world.weather.getCurrentTemperature()}
          />
        </div>
        {this.maybeRenderSpeciesViewer()}
        {this.maybeRenderCollectButton()}
        {this.maybeRenderWinShine()}
        {this.maybeRenderGerminateButton()}
        {this.maybeRenderPausedUI()}
        {this.maybeRenderInvalidAction()}
        {this.maybeRenderTutorial()}
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

  maybeRenderTutorial() {
    const showPlayerHUD = this.world.playerSeed == null;
    if (this.mito.isFirstPlaythrough && showPlayerHUD) {
      return <Tutorial {...this.props} />;
    }
  }

  // no-op
  private handleDragEnd = () => {};
}

function useCountActions(player: Player, predicate: (action: Action) => boolean) {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const cb = (action: Action) => {
      if (predicate(action)) {
        setCount((c) => c + 1);
      }
    };
    player.on("action", cb);
    return () => {
      player.off("action", cb);
    };
  });
  return count;
}

function useCountActionTarget(player: Player, predicate: (a: Action) => boolean, target: number) {
  const count = useCountActions(player, predicate);
  return count / target;
}

interface TutorialStepProps {
  player: Player;
  setPercentDone: (percent: number) => void;
}

const build = (name: string) => {
  return (action: Action) => action.type === "build" && action.cellType.name === name;
};

const tutorialSteps: Array<React.FC<TutorialStepProps>> = [
  ({ player, setPercentDone }) => {
    setPercentDone(useCountActionTarget(player, (action) => action.type === "move", 150));
    return (
      <>
        Move - <HotkeyButton hotkey="W" />
        <HotkeyButton hotkey="A" />
        <HotkeyButton hotkey="S" />
        <HotkeyButton hotkey="D" />
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(useCountActionTarget(player, build("Tissue"), 3));
    return (
      <>
        Grow Tissue - <HotkeyButton hotkey="1" />, click.{" "}
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(useCountActionTarget(player, build("Root"), 5));
    return (
      <>
        Grow Roots - <HotkeyButton hotkey="3" />, click Soil.
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(
      useCountActionTarget(
        player,
        (action) => action.type === "pickup" && action.target instanceof Cell && action.target.displayName === "Root",
        14
      )
    );
    return (
      <>
        Take water from Roots - <HotkeyButton hotkey="Q" />, click Root.
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(useCountActionTarget(player, build("Leaf"), 5));
    return (
      <>
        Grow Leaves - <HotkeyButton hotkey="2" />, click Air.
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(
      useCountActionTarget(
        player,
        (action) => action.type === "drop" && action.target instanceof Cell && action.target.displayName === "Leaf",
        25
      )
    );
    return (
      <>
        Put water in Leaf - <HotkeyButton hotkey="Q" />, click Leaf.
      </>
    );
  },
  ({ player, setPercentDone }) => {
    const [sugarMade, setSugarMade] = React.useState(0);
    React.useEffect(() => {
      const cb = (stats: StepStats) => {
        const sugarMade = stats.events.photosynthesis.reduce(
          (sum, event: EventPhotosynthesis) => event.sugarMade + sum,
          0
        );
        setSugarMade((s) => s + sugarMade);
      };
      player.world.on("step", cb);
      return () => {
        player.world.off("step", cb);
      };
    }, [player.world]);
    setPercentDone(sugarMade / 5);
    return <>Wait for Photosynthesis.</>;
  },
  ({ player, setPercentDone }) => {
    setPercentDone(useCountActionTarget(player, build("Seed"), 1));
    return (
      <>
        Grow Seed - <HotkeyButton hotkey="4" />, click.
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(
      useCountActionTarget(
        player,
        (action) => action.type === "drop" && action.target instanceof Cell && action.target.displayName === "Tissue",
        5
      )
    );
    return (
      <>
        Feed Tissue - <HotkeyButton hotkey="Q" />, click Tissue.
      </>
    );
  },
  ({ player, setPercentDone }) => {
    const percentDone =
      (Array.from(player.world.mpEarners.keys())[0]?.findGene(GeneSeed)?.state.energyRecieved ?? 0) / 100;
    setPercentDone(percentDone);
    return <>Get seed to 100 energy.</>;
  },
];

const TutorialStepContainer: React.FC<{
  mito: Mito;
  active: boolean;
  isFirst: boolean;
  Step: React.FC<TutorialStepProps>;
  onDone: () => void;
}> = ({ mito, active, isFirst, Step, onDone }) => {
  const [percentDoneRaw, setPercentDone] = React.useState(0);
  const percentDone = Math.min(percentDoneRaw, 1);
  const isDone = percentDone >= 1;

  React.useEffect(() => {
    if (isDone) {
      onDone();
    }
  }, [isDone, onDone]);

  const percentCss = `${(percentDone * 100).toFixed(1)}%`;
  const style: React.CSSProperties = {
    // background: `linear-gradient(to right, ${filled}, ${filled} ${percentCss}, transparent ${percentCss}, transparent)`,
    width: percentCss,
  };

  // kill animation in the WASD tutorial
  if (isFirst) {
    style.transition = "unset";
  }

  return (
    <div className={classNames("instruction", { active, first: isFirst, done: isDone })}>
      <div className="background-fill" style={style} />
      <Step player={mito.world.player} setPercentDone={setPercentDone} />
    </div>
  );
};

const Tutorial = ({ mito }: HUDProps) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const handleDone = React.useCallback(() => {
    setActiveIndex((i) => i + 1);
  }, []);
  return (
    <div className="hud-left">
      {tutorialSteps.map((Step, index) => (
        <TutorialStepContainer
          mito={mito}
          active={activeIndex === index}
          Step={Step}
          isFirst={index === 0}
          onDone={handleDone}
          key={index}
        />
      ))}
    </div>
  );
};

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
