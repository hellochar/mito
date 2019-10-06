import React from "react";

import { FullPageSketch } from "./sketches/fullPageSketch";
import Mito, { GameResult } from "./sketches/mito";
import { OverWorldMap } from "./overworld/OverWorldMap";
import { OverWorld } from "./overworld/overWorld";
import { HexTile } from "./overworld/hexTile";
import GameResultsScreen from "./sketches/mito/ui/GameResultsScreen";
import { Species, newBaseSpecies } from "./evolution/species";

export interface AppState {
  overWorld: OverWorld;
  activeLevel?: HexTile;
  activeGameResult?: GameResult;
  rootSpecies: Species;
}

class App extends React.PureComponent<{}, AppState> {
  // static contextType = AppContext;
  // context!: React.ContextType<typeof AppContext>;

  constructor(props: {}) {
    super(props);
    const overWorld = OverWorld.generateRectangle(100, 50);
    const activeLevel = overWorld.getStartTile();
    const rootSpecies = newBaseSpecies("plantum originus");
    rootSpecies.freeMutationPoints = 25;
    const s3 = newBaseSpecies("s3");
    s3.descendants = [newBaseSpecies("ya"), newBaseSpecies("no"), newBaseSpecies("whoa")];
    let s: Species;
    rootSpecies.descendants = [s = newBaseSpecies("foo"), newBaseSpecies("bar"), s3];
    s.descendants = [newBaseSpecies("1"), newBaseSpecies("2")]
    this.state = {
      overWorld,
      activeLevel: undefined,
      rootSpecies,
    };
  }

  handlePlayLevel = (level: HexTile) => {
    if (level.info.visible) {
      this.setState({ activeLevel: level });
    }
  };

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
      <div className="App">
        {this.maybeRenderOverWorldMap()}
        {this.maybeRenderLevel()}
        {this.maybeRenderGameResult()}
      </div>
    );
  }

  maybeRenderOverWorldMap() {
    if (this.state.activeLevel == null) {
      return <OverWorldMap overWorld={this.state.overWorld} rootSpecies={this.state.rootSpecies} onPlayLevel={this.handlePlayLevel} />;
    }
  }

  maybeRenderLevel() {
    if (this.state.activeLevel != null && this.state.activeGameResult == null) {
      return <FullPageSketch sketchClass={Mito} otherArgs={[this.state.activeLevel, this.state.rootSpecies, this.handleWinLoss]} />;
    }
  }

  maybeRenderGameResult() {
    if (this.state.activeGameResult != null) {
      return <GameResultsScreen results={this.state.activeGameResult} onDone={this.handleResultsDone} />;
    }
  }
}

export default App;
