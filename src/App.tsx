import React, { useReducer } from "react";

import { FullPageSketch } from "./sketches/fullPageSketch";
import Mito, { GameResult } from "./sketches/mito";
import { OverWorldMap } from "./overworld/map/OverWorldMap";
import { OverWorld } from "./overworld/overWorld";
import { HexTile } from "./overworld/hexTile";
import GameResultsScreen from "./sketches/mito/ui/GameResultsScreen";
import { Species, newBaseSpecies } from "./evolution/species";
import { createSelector } from "reselect";
import { MousePositionContext } from "common/useMousePosition";

export interface AppState {
  overWorld: OverWorld;
  activeLevel?: HexTile;
  activeSpecies?: Species;
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
    const activeLevel = overWorld.getStartTile();
    rootSpecies.freeMutationPoints = 25;
    // const s3 = newBaseSpecies("s3");
    // s3.descendants = [newBaseSpecies("ya"), newBaseSpecies("no"), newBaseSpecies("whoa")];
    // let s: Species;
    // rootSpecies.descendants = [s = newBaseSpecies("foo"), newBaseSpecies("bar"), s3];
    // s.descendants = [newBaseSpecies("1"), newBaseSpecies("2")]
    this.state = {
      overWorld,
      activeLevel,
      activeSpecies: rootSpecies,
      rootSpecies,
      epoch: 1,
      mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    };
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

  handlePlayLevel = (level: HexTile, species: Species) => {
    if (level.info.visible) {
      this.setState({ activeLevel: level, activeSpecies: species });
    }
  };

  handleNextEpoch = () => {
    this.setState({ epoch: this.state.epoch + 1 });
  }

  handleWinLoss = (result: GameResult) => {
    this.setState({ activeGameResult: result });
    if (result.status === "won" && this.state.activeLevel != null) {
      const { activeLevel } = this.state;
      activeLevel.info.flora = {
        species: result.world.species,
        mutationPointsPerEpoch: result.fruits.filter((x) => x.isMature()).length,
      };

      for (const n of activeLevel.neighbors) {
        n.info.visible = true;
      }
    }
  };

  handleResultsDone = () => {
    this.setState({
      activeLevel: undefined,
      activeGameResult: undefined,
    });
  };

  render() {
    return (
      <MousePositionContext.Provider value={this.state.mousePosition}>
        <div className="App">
          {this.maybeRenderOverWorldMap()}
          {this.maybeRenderLevel()}
          {this.maybeRenderGameResult()}
        </div>
      </MousePositionContext.Provider>
    );
  }

  maybeRenderOverWorldMap() {
    if (this.state.activeLevel == null) {
      return (
        <OverWorldMap
          epoch={this.state.epoch}
          overWorld={this.state.overWorld}
          rootSpecies={this.state.rootSpecies}
          onPlayLevel={this.handlePlayLevel}
          onNextEpoch={this.handleNextEpoch}
        />
      );
    }
  }

  private otherArgsSelector = createSelector(
    (s: AppState) => s.activeLevel,
    (s: AppState) => s.activeSpecies,
    (level, species) => [level, species, this.handleWinLoss]
  );

  maybeRenderLevel() {
    if (this.state.activeLevel != null && this.state.activeGameResult == null) {
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
