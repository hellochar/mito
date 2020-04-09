import "@blueprintjs/core/lib/css/blueprint.css";
// import "@blueprintjs/icons/lib/css/blueprint.css";
import "rc-tooltip/assets/bootstrap.css";
import React from "react";
import ReactDOM from "react-dom";
import "react-dropdown/style.css";
import { HashRouter } from "react-router-dom";
import Routes from "Routes";
import DndTest from "tests/DndTest";
import "./addThreeJsModelSchemas";
import "./index.scss";
import * as serviceWorker from "./serviceWorker";

function requireAll(r: any) {
  r.keys().forEach(r);
}
requireAll((require as any).context("./std/genes/", true, /Gene.*\.tsx?$/));

const e = (
  <HashRouter>
    <Routes />
  </HashRouter>
);

ReactDOM.render(
  <DndTest />,

  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
