import React from "react";

import { FullPageSketch } from "./fullPageSketch";
import Mito, { GameResult } from "./sketches/mito";
import { OverWorldMap } from "./overworld/OverWorldMap";
import { OverWorld } from "./overworld/overWorld";
import { HexTile } from "./overworld/hexTile";
import GameResultsScreen from "./sketches/mito/ui/GameResultsScreen";

export interface AppState {
  overWorld: OverWorld;
  activeLevel?: HexTile;
  activeGameResult?: GameResult;
}

class App extends React.PureComponent<{}, AppState> {
  constructor(props: {}) {
    super(props);
    const overWorld = OverWorld.generateRectangle(100, 50);
    const activeLevel = overWorld.getStartTile();
    this.state = {
      overWorld,
      activeLevel,
    };
  }

  handlePlayLevel = (level: HexTile) => {
    if (level.info.visible && !level.info.conquered) {
      this.setState({ activeLevel: level });
    }
  };

  handleWinLoss = (result: GameResult) => {
    this.setState({ activeGameResult: result });
    if (result.status === "won" && this.state.activeLevel != null) {
      const { activeLevel } = this.state;
      activeLevel.info.conquered = true;

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
      return <OverWorldMap overWorld={this.state.overWorld} onPlayLevel={this.handlePlayLevel} />;
    }
  }

  maybeRenderLevel() {
    if (this.state.activeLevel != null && this.state.activeGameResult == null) {
      return <FullPageSketch sketchClass={Mito} otherArgs={[this.state.activeLevel, this.handleWinLoss]} />;
    }
  }

  maybeRenderGameResult() {
    if (this.state.activeGameResult != null) {
      return <GameResultsScreen results={this.state.activeGameResult} onDone={this.handleResultsDone} />;
    }
  }
}

export default App;
