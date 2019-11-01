import React from "react";
import ReactDOM from "react-dom";
import 'react-dropdown/style.css';
import { HashRouter, Redirect, Route, Switch } from "react-router-dom";
import { serializable, serialize } from "serializr";
import App from "./app/App";
import "./index.scss";
import * as serviceWorker from "./serviceWorker";
import TestStats from "./tests/TestStats";
import { TestWinScreen } from "./tests/TestWinScreen";

class HexTile {
  @serializable public i: number;
  @serializable public j: number;
  constructor(i = 0, j = 0) {
    this.i = i;
    this.j = j;
  }

  get k() {
    return -(this.i + this.j);
  }
}

const Test = () => {
  const user = new User();
  const json = serialize(user);
  return <pre>
    {JSON.stringify(json)}
  </pre>
};

ReactDOM.render(
  <HashRouter>
    <Switch>
      <Route path="/foo">
        <Test />
      </Route>
      <Route path="/test-win">
        <TestWinScreen />
      </Route>
      <Route path="/test-stats">
        <TestStats />
      </Route>
      <Route exact path="/">
        <App />
      </Route>
      <Route path="*">
        <Redirect to="/" />
      </Route>
    </Switch>
  </HashRouter>,

  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
