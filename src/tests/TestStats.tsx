import { Environment } from "core/environment";
import { Layout, PlotData } from "plotly.js";
import React from "react";
import { World } from "../core";
import { newBaseSpecies } from "../core/species";
import { Air, Fountain, Rock, Soil } from "../core/tile";
import { Desert, Rocky, Temperate } from "../std/environments";
import { findBuildCandidateTiles } from "../std/worldUtils";
import { Experiment, ExperimentSuite } from "./experiment";

function runTests(environment: Environment, id: string) {
  console.log("running");
  const suite = new ExperimentSuite([
    new Experiment({
      countAir: (t) => t.filter((tile) => tile.constructor === Air).length,
    }),
    new Experiment({
      countSoil: (t) => t.filter((tile) => tile.constructor === Soil).length,
    }),
    new Experiment({
      countRock: (t) => t.filter((tile) => tile.constructor === Rock).length,
    }),
    new Experiment({
      countFountain: (t) => t.filter((tile) => tile.constructor === Fountain).length,
    }),
    new Experiment({
      playerY: (_, w) => w.player.pos.y,
    }),
    new Experiment({
      startAdjacentWaters: (_, w) => {
        const adjacentTiles = findBuildCandidateTiles(w, (t) => t instanceof Soil);
        let water = 0;
        for (const t of adjacentTiles) {
          water += t.inventory.water;
        }
        return water;
      },
    }),
    new Experiment({
      countWaters: (t) => {
        return t.reduce((w, tile) => w + tile.inventory.water, 0);
      },
    }),
  ]);
  for (let i = 0; i < 20; i++) {
    console.time("trial " + i);
    const world = new World(environment, i, newBaseSpecies());
    suite.recordDataFor(Array.from(world.allEnvironmentTiles()));
    console.timeEnd("trial " + i);
  }

  plotStackedBar(suite.experiments.slice(0, 4), id);

  for (const e of suite.experiments) {
    plotHistogram(e, id);
  }
}

function plotStackedBar(experiments: Experiment[], divId: string) {
  const data = [];
  const names = experiments.map((e) => e.visitorNames().join(""));
  for (const idx in names) {
    const name = names[idx];
    const x = [];
    const y = [];
    for (let i = 0; i < experiments[0].trials.length; i++) {
      x.push(i);

      const e = experiments[idx];
      const trial = e.trials[i];
      const value = trial[name];
      y.push(value);
    }
    const trace: Partial<PlotData> = {
      x,
      y,
      name,
      type: "bar",
    };
    data.push(trace);
  }
  var layout: Partial<Layout> = { barmode: "stack" };

  const div = document.createElement("div");
  const el = document.getElementById(divId)!;
  el.appendChild(div);
  window.Plotly.newPlot(div, data, layout);
}

function plotHistogram(stats: Experiment, divId: string) {
  const data = [];
  const layout: Partial<Layout> = {};

  for (const name of stats.visitorNames()) {
    var trace: Partial<PlotData> = {
      x: stats.trials.map((t) => t[name]),
      type: "histogram",
      name: name,
    };
    data.push(trace);

    layout.title = {
      text: name,
    };
  }
  const div = document.createElement("div");
  const el = document.getElementById(divId)!;
  el.appendChild(div);
  div.style.height = "240px";
  div.style.width = "320px";
  div.style.display = "inline-block";
  window.Plotly.newPlot(div, data, layout);
}

function TestStats() {
  React.useEffect(() => {
    var script = document.createElement("script");
    script.src = "https://cdn.plot.ly/plotly-latest.min.js";
    script.addEventListener("load", function() {
      runTests(Temperate, "temperate");
      runTests(Rocky, "rocky");
      runTests(Desert, "desert");
    });

    document.body.appendChild(script);
  }, []);

  return (
    <div>
      <h1>Experiments</h1>
      <div id="temperate">
        <h2>Temperate</h2>
      </div>
      <div id="rocky">
        <h2>Rocky</h2>
      </div>
      <div id="desert">
        <h2>Desert</h2>
      </div>
    </div>
  );
}

export default TestStats;
