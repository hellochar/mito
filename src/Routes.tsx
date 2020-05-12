import React from "react";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";
import TestDiffusion from "tests/TestDiffusion";
import TestLevel from "tests/TestLevel";
import { TestLoseScreen } from "tests/TestLoseScreen";
import { TestWinScreen } from "tests/TestWinScreen";
import WFCTest from "tests/WFCTest";
import App from "./game/screens/App";
import "./index.scss";
import TestStats from "./tests/TestStats";

export default () => (
  <Switch>
    <Route path="/test-lose">
      <TestLoseScreen />
    </Route>
    <Route path="/test-win">
      <TestWinScreen />
    </Route>
    <Route path="/test-stats">
      <TestStats />
    </Route>
    <Route path="/test-diffusion">
      <TestDiffusion />
    </Route>
    <Route path="/test-level">
      <TestLevel />
    </Route>
    <Route path="/wfc">
      <WFCTest />
    </Route>
    <Route exact path="/">
      <App />
    </Route>
    <Route path="*" component={Page404} />
  </Switch>
);

const Page404: React.FC<RouteComponentProps> = () => {
  return (
    <div>
      <h1>Unknown page</h1>
      <Link to="/">Back to main screen</Link>
    </div>
  );
};
