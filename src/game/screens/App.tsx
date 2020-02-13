import { MousePositionContext } from "common/useMousePosition";
import { GameResult } from "game/gameResult";
import OverWorldScreen from "game/screens/OverWorldScreen";
import React from "react";
import { CSSTransition } from "react-transition-group";
import { createSelector } from "reselect";
import { FullPageSketch } from "../../sketches/fullPageSketch";
import Mito from "../../sketches/mito";
import { LocalForageStateProvider } from "../app/AppStateProvider";
import { AppReducerContext, useAppReducer } from "../app/reducer";
import { AppState } from "../app/state";
import "./App.scss";
import GameResultsScreen from "./GameResultsScreen";

interface AppComponentState {
  mousePosition: { x: number; y: number };
  showTestLoseScreen?: boolean;
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
      type: "AATransitionStart",
      transition: {
        type: "AAGetGameResult",
        result,
      },
    });
  };

  handleResultsDone = () => {
    const [, dispatch] = this.context;
    dispatch({
      type: "AATransitionStart",
      transition: {
        type: "AAGameResultDone",
      },
    });
  };

  render() {
    const [state] = this.context;
    return (
      <MousePositionContext.Provider value={this.state.mousePosition}>
        <div className="App">
          <AppScreen show={state.activePopulationAttempt == null}>
            <OverWorldScreen onNextEpoch={this.handleNextEpoch} />
          </AppScreen>
          <AppScreen show={state.activePopulationAttempt != null && state.activeGameResult == null}>
            <FullPageSketch sketchClass={Mito} otherArgs={this.otherArgsSelector(state)} />
          </AppScreen>
          <AppScreen show={state.activeGameResult != null}>
            {state.activeGameResult ? (
              <GameResultsScreen results={state.activeGameResult} onDone={this.handleResultsDone} />
            ) : (
              // HACK AppScreen *needs* one element; I think there's one single tick where
              // AppScreen is still rendering its children even when it shouldn't.
              <div></div>
            )}
          </AppScreen>
        </div>
      </MousePositionContext.Provider>
    );
  }

  private otherArgsSelector = createSelector(
    (s: AppState) => s.activePopulationAttempt,
    (activePopulationAttempt) => [activePopulationAttempt, this.handleWinLoss]
  );
}

const AppScreen: React.FC<{ show: boolean; children?: JSX.Element }> = ({ show, children }) => {
  const [state] = useAppReducer();
  return (
    <CSSTransition
      in={show && state.transition == null}
      timeout={2000}
      mountOnEnter
      unmountOnExit
      classNames="fade-to-black"
    >
      {children}
    </CSSTransition>
  );
};

const App = () => (
  <LocalForageStateProvider loadingComponent={<div>Loading...</div>}>
    <AppComponent />
  </LocalForageStateProvider>
);

export default App;
