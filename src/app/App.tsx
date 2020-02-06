import { MousePositionContext } from "common/useMousePosition";
import OverWorldScreen from "overworld/OverWorldScreen";
import React from "react";
import { createSelector } from "reselect";
import { GameResult } from "sketches/mito/game/gameResult";
import { FullPageSketch } from "../sketches/fullPageSketch";
import Mito from "../sketches/mito";
import GameResultsScreen from "../sketches/mito/ui/GameResultsScreen";
import { LocalForageStateProvider } from "./AppStateProvider";
import { AppReducerContext } from "./reducer";
import { AppState } from "./state";

interface AppComponentState {
  mousePosition: { x: number; y: number };
}

class AppComponent extends React.PureComponent<{}, AppComponentState> {
  static contextType = AppReducerContext;

  context!: React.ContextType<typeof AppReducerContext>;

  constructor(props: {}, context: any) {
    super(props, context);
    this.state = {
      mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    };
  }

  handleMousePosition = (e: MouseEvent) => {
    this.setState({
      mousePosition: { x: e.clientX, y: e.clientY },
    });
  };

  componentDidMount() {
    document.addEventListener("mousemove", this.handleMousePosition);
  }

  componentWillUnmount() {
    document.removeEventListener("mousemove", this.handleMousePosition);
  }

  handleNextEpoch = () => {
    const [, dispatch] = this.context;
    dispatch({ type: "AANextEpoch" });
  };

  handleWinLoss = (result: GameResult) => {
    const [, dispatch] = this.context;
    dispatch({
      type: "AAGetGameResult",
      result,
    });
  };

  handleResultsDone = () => {
    const [, dispatch] = this.context;
    dispatch({
      type: "AAGameResultDone",
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
    const [state] = this.context;
    if (state.activePopulationAttempt == null) {
      return <OverWorldScreen onNextEpoch={this.handleNextEpoch} />;
    }
  }

  private otherArgsSelector = createSelector(
    (s: AppState) => s.activePopulationAttempt,
    (activePopulationAttempt) => [activePopulationAttempt, this.handleWinLoss]
  );

  maybeRenderInGame() {
    const [state] = this.context;
    if (state.activePopulationAttempt != null && state.activeGameResult == null) {
      return <FullPageSketch sketchClass={Mito} otherArgs={this.otherArgsSelector(state)} />;
    }
  }

  maybeRenderGameResult() {
    const [state] = this.context;
    if (state.activeGameResult != null) {
      return <GameResultsScreen results={state.activeGameResult} onDone={this.handleResultsDone} />;
    }
  }
}

const App = () => (
  <LocalForageStateProvider loadingComponent={<div>Loading...</div>}>
    <AppComponent />
  </LocalForageStateProvider>
);

export default App;
