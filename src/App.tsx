import { MousePositionContext } from "common/useMousePosition";
import OverWorldScreen from "overworld/OverWorldScreen";
import React from "react";
import { createSelector } from "reselect";
import { lineage, newBaseSpecies, Species } from "./evolution/species";
import { HexTile } from "./overworld/hexTile";
import { OverWorld } from "./overworld/overWorld";
import { FullPageSketch } from "./sketches/fullPageSketch";
import Mito, { GameResult } from "./sketches/mito";
import GameResultsScreen from "./sketches/mito/ui/GameResultsScreen";

export interface PopulationAttempt {
  sourceHex?: HexTile;
  targetHex: HexTile;
  settlingSpecies: Species;
}

export interface AppState {
  overWorld: OverWorld;
  /**
   * Determines whether we're in the game or in the overworld.
   *
   * Null activeLevel means we're in overworld.
   * Non-null means we're in-game, or in the game results screen.
   */
  activePopulationAttempt?: PopulationAttempt;
  /**
   * Determines whether to show the game over screen. While non-null,
   * we show a game result screen.
   */
  activeGameResult?: GameResult;
  rootSpecies: Species;
  epoch: number;
  mousePosition: { x: number, y: number };
}

class App extends React.PureComponent<{}, AppState> {
  // static contextType = AppContext;
  // context!: React.ContextType<typeof AppContext>;

  constructor(props: {}) {
    super(props);
    const overWorld = OverWorld.generateRectangle(100, 50);
    const rootSpecies = newBaseSpecies("plantum originus");
    // const activeLevel = overWorld.getStartTile();
    // rootSpecies.freeMutationPoints = 25;
    // const s3 = newBaseSpecies("s3");
    // s3.descendants = [newBaseSpecies("ya"), newBaseSpecies("no"), newBaseSpecies("whoa")];
    // let s: Species;
    // rootSpecies.descendants = [s = newBaseSpecies("foo"), newBaseSpecies("bar"), s3];
    // s.descendants = [newBaseSpecies("1"), newBaseSpecies("2")]
    this.state = {
      overWorld,
      rootSpecies,
      epoch: 1,
      mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    };
    this.doPopulationAttemptSuccess({
      settlingSpecies: rootSpecies,
      targetHex: overWorld.getStartTile(),
    }, { status: "won", mutationPointsPerEpoch: 1, fruits: [], world: null! });
  }


  handleMousePosition = (e: MouseEvent) => {
    this.setState({
      mousePosition: { x: e.clientX, y: e.clientY },
    });
  }

  componentDidMount() {
    document.addEventListener("mousemove", this.handleMousePosition);
  }

  componentWillUnmount() {
    document.removeEventListener("mousemove", this.handleMousePosition);
  }

  doPopulationAttemptSuccess(attempt: PopulationAttempt, results: GameResult) {
    const { targetHex, sourceHex, settlingSpecies } = attempt;
    // use the action point
    if (sourceHex != null) {
      sourceHex.info.flora!.actionPoints -= 1;
    }

    // populate target hex
    let oldSpecies: Species | undefined = undefined;
    if (targetHex.info.flora != null) {
      oldSpecies = targetHex.info.flora.species;
    }
    targetHex.info.flora = {
      species: settlingSpecies,
      mutationPointsPerEpoch: results.mutationPointsPerEpoch,
      actionPoints: 0,
    };
    settlingSpecies.totalMutationPoints = this.state.overWorld.getMaxGenePool(settlingSpecies);
    if (oldSpecies) {
      // update old species mutation point pool cache
      oldSpecies.totalMutationPoints = this.state.overWorld.getMaxGenePool(oldSpecies);
    }

    // bump visibility
    for (const n of targetHex.neighbors) {
      n.info.visible = true;
    }
  }

  handlePopulationAttempt = (targetHex: HexTile, settlingSpecies: Species, sourceHex?: HexTile) => {
    if (targetHex.info.visible) {
      if (sourceHex != null && sourceHex.info.flora != null && sourceHex.info.flora.actionPoints < 1) {
        return;
      }
      const activePopulationAttempt: PopulationAttempt = {
        settlingSpecies,
        sourceHex,
        targetHex,
      }
      this.setState({ activePopulationAttempt });
    }
  };

  handleNextEpoch = () => {
    // +1 epoch:
    // reset action points of all habited tiles to 1
    this.state.overWorld.resetActionPoints();
    // reset all species pools to max
    for (const species of lineage(this.state.rootSpecies)) {
      species.freeMutationPoints = species.totalMutationPoints;
    }
    this.setState({ epoch: this.state.epoch + 1 });
  }

  handleWinLoss = (result: GameResult) => {
    if (this.state.activePopulationAttempt == null) {
      throw new Error("activePopulationAttempt shouldn't be null during handleWinLoss");
    }
    this.setState({ activeGameResult: result });
    if (result.status === "won") {
      this.doPopulationAttemptSuccess(this.state.activePopulationAttempt, result)
    }
  };

  handleResultsDone = () => {
    this.setState({
      activePopulationAttempt: undefined,
      activeGameResult: undefined,
    });
  };

  render() {
    return (
      <MousePositionContext.Provider value={this.state.mousePosition}>
        <div className="App">
          {this.maybeRenderOverWorld()}
          {this.maybeRenderInGame()}
          {this.maybeRenderGameResult()}
        </div>
      </MousePositionContext.Provider>
    );
  }

  maybeRenderOverWorld() {
    if (this.state.activePopulationAttempt == null) {
      return (
        <OverWorldScreen
          epoch={this.state.epoch}
          overWorld={this.state.overWorld}
          rootSpecies={this.state.rootSpecies}
          onPopulationAttempt={this.handlePopulationAttempt}
          onNextEpoch={this.handleNextEpoch}
        />
      );
    }
  }

  private otherArgsSelector = createSelector(
    (s: AppState) => s.activePopulationAttempt,
    (activePopulationAttempt) => [activePopulationAttempt, this.handleWinLoss]
  );

  maybeRenderInGame() {
    if (this.state.activePopulationAttempt != null && this.state.activeGameResult == null) {
      return <FullPageSketch sketchClass={Mito} otherArgs={this.otherArgsSelector(this.state)} />;
    }
  }

  maybeRenderGameResult() {
    if (this.state.activeGameResult != null) {
      return <GameResultsScreen results={this.state.activeGameResult} onDone={this.handleResultsDone} />;
    }
  }
}

export default App;
