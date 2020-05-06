import { MousePositionContext } from "common/useMousePosition";
import { GameResult } from "game/gameResult";
import OverWorldScreen from "game/screens/OverWorldScreen";
import { Button } from "game/ui/common/Button";
import React, { memo, useRef } from "react";
import { FaDiscord } from "react-icons/fa";
import { CSSTransition } from "react-transition-group";
import { createSelector } from "reselect";
import { serialize } from "serializr";
import { LocalForageStateProvider } from "../app/AppStateProvider";
import { AppReducerContext, useAppReducer } from "../app/reducer";
import { AppState, AppStateSchema } from "../app/state";
import "./App.scss";
import GameResultsScreen from "./GameResultsScreen";
import MitoScreen from "./MitoScreen";
import StartScreen from "./StartScreen";

interface AppComponentState {
  mousePosition: { x: number; y: number };
  showStartScreen: boolean;
  error?: Error;
}

class AppComponent extends React.PureComponent<{}, AppComponentState> {
  static contextType = AppReducerContext;

  context!: React.ContextType<typeof AppReducerContext>;

  constructor(props: {}, context: any) {
    super(props, context);
    this.state = {
      mousePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      showStartScreen: true,
      error: undefined,
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

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  // componentDidCatch(error: Error) {
  //   this.setState({
  //     error,
  //   });
  // }

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

  handleCloseStartScreen = () => this.setState({ showStartScreen: false });

  render() {
    const [state] = this.context;

    const appContent = this.state.error ? (
      <AppError error={this.state.error} appState={state} />
    ) : (
      <>
        <AppScreen show={this.state.showStartScreen}>
          <StartScreen onStart={this.handleCloseStartScreen} />
        </AppScreen>
        <AppScreen show={state.activePopulationAttempt == null && !this.state.showStartScreen}>
          <OverWorldScreen onNextEpoch={this.handleNextEpoch} />
        </AppScreen>
        <AppScreen show={state.activePopulationAttempt != null && state.activeGameResult == null}>
          <MitoScreen attempt={state.activePopulationAttempt!} onWinLoss={this.handleWinLoss} />
        </AppScreen>
        <AppScreen show={state.activeGameResult != null}>
          {state.activeGameResult ? (
            <GameResultsScreen
              attempt={state.activePopulationAttempt}
              results={state.activeGameResult}
              onDone={this.handleResultsDone}
            />
          ) : (
            // HACK AppScreen *needs* one element; I think there's one single tick where
            // AppScreen is still rendering its children even when it shouldn't.
            <div></div>
          )}
        </AppScreen>
      </>
    );

    return (
      <MousePositionContext.Provider value={this.state.mousePosition}>
        <div className="App">{appContent}</div>
      </MousePositionContext.Provider>
    );
  }

  private otherArgsSelector = createSelector(
    (s: AppState) => s.activePopulationAttempt,
    (activePopulationAttempt) => [activePopulationAttempt, this.handleWinLoss]
  );
}

const AppError = React.memo(({ error, appState }: { error: Error; appState: AppState }) => {
  const appStateJson = serialize(AppStateSchema, appState);
  const errorRef = useRef<HTMLTextAreaElement>(null);
  const errorReport = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    time: new Date(),
    appState: appStateJson,
  };
  const handleClick = () => {
    const el = errorRef.current;
    if (el) {
      el.select();
      document.execCommand("copy");
    }
  };
  return (
    <div className="app-error">
      {/* eslint-disable-next-line jsx-a11y/accessible-emoji */}
      <h1>😢😢😢Mito has crashed! 😢😢😢</h1>
      <div className="bottom">
        <p>Please report this to the dev team.</p>
        <div className="instructions">
          <Button className="copy" onClick={handleClick}>
            Copy Error Report
          </Button>
          <span className="arrow-right">➡</span>
          <a className="discord" rel="noopener noreferrer" target="_blank" href="http://discord.gg/N8wWwPX">
            <FaDiscord />
          </a>
        </div>
      </div>
      <textarea ref={errorRef} className="error-textarea" value={JSON.stringify(errorReport, null, 2)} readOnly />
    </div>
  );
});

const AppScreen: React.FC<{ show: boolean; children?: JSX.Element }> = memo(({ show, children }) => {
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
});

const App = () => (
  <LocalForageStateProvider loadingComponent={<div>Loading...</div>}>
    <AppComponent />
  </LocalForageStateProvider>
);

export default App;
