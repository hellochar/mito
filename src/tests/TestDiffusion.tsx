import { Layout, PlotData } from "plotly.js";
import React from "react";
import { Cell } from "sketches/mito/game/tile";
import { GeneVascular } from "sketches/mito/game/tile/genes";
import Genome from "sketches/mito/game/tile/genome";
import { Inventory } from "sketches/mito/inventory";
import { Vector2 } from "three";
import { newBaseSpecies } from "../evolution/species";
import { step, World } from "../sketches/mito/game";
import { Environment } from "../sketches/mito/game/environment";
import { Experiment, Visitors } from "./experiment";

class PureGenomeCell extends Cell {
  public inventory = new Inventory(10, this);
  step(dt: number) {
    this.geneInstances.forEach((g) => step(g, dt));
  }
}

const vascularGenome = new Genome(GeneVascular);

const allSoilEnvironment: Environment = {
  airEvaporation: 0,
  climate: { rainDuration: 0, timeBetweenRainfall: Infinity, waterPerSecond: 0 },
  fill: (pos, world) => undefined,
  secondsToEvaporate: Infinity,
  floorCo2: 1,
  temperaturePerSeason: [50, 50, 50, 50],
};

function runTest() {
  const world = new World(allSoilEnvironment, 0, newBaseSpecies(), {
    width: 20,
    height: 1,
    growInitialTissue: false,
  });
  for (let x = 0; x < world.width; x++) {
    const p = new Vector2(x, 0);
    world.setTileAt(p, new PureGenomeCell(p, world, vascularGenome));
  }
  world.cellAt(0, 0)!.inventory.set(10, 0);
  const visitors: Visitors = {};
  for (const cell of world.allCells()) {
    visitors[cell.toString()] = () => {
      return cell.inventory.water;
    };
  }
  const experiment = new Experiment(visitors);
  do {
    experiment.recordDataFor(world);
    world.step(0.1);
  } while (world.time <= 1);
  return experiment;
}

function plotStackedBar(experiment: Experiment, divId: string) {
  const data = [];
  for (const trialIndex in experiment.trials) {
    const trial = experiment.trials[trialIndex];
    const x = [];
    const y = [];
    for (const name of experiment.visitorNames()) {
      x.push(name);
      const value = trial[name];
      y.push(value);
    }
    const trace: Partial<PlotData> = {
      x,
      y,
      name: `t=${Number(trialIndex) / 10}`,
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

function TestDiffusion() {
  React.useEffect(() => {
    var script = document.createElement("script");
    script.src = "https://cdn.plot.ly/plotly-latest.min.js";
    script.addEventListener("load", function() {
      const e = runTest();
      plotStackedBar(e, "water-over-time");
    });
    script.addEventListener("error", () => {
      const e = runTest();
      console.table(e.trials);
    });

    document.body.appendChild(script);
  }, []);

  return (
    <div>
      <h1>Test Diffusion</h1>
      <div id="water-over-time">
        <h2>width 20 world, water from t=0 to t=1 </h2>
      </div>
    </div>
  );
}

export default TestDiffusion;
