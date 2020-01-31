import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import TestDiffusion from "tests/TestDiffusion";
import { TestLoseScreen } from "tests/TestLoseScreen";
import { TestWinScreen } from "tests/TestWinScreen";
import App from "./app/App";
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
    <Route exact path="/">
      <App />
    </Route>
    <Route path="*">
      <Redirect to="/" />
    </Route>
  </Switch>
);