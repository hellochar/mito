import React from "react";
import ReactDOM from "react-dom";
import "react-dropdown/style.css";
import { HashRouter } from "react-router-dom";
import Routes from "Routes";
import "./addThreeJsModelSchemas";
import "./index.scss";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(
  <HashRouter>
    <Routes />
  </HashRouter>,

  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
