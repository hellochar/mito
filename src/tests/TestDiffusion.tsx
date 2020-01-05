import { Layout, PlotData } from "plotly.js";
import React from "react";
import { Cell, Tissue } from "sketches/mito/game/tile";
import Chromosome from "sketches/mito/game/tile/chromosome";
import { GeneVascular } from "sketches/mito/game/tile/genes";
import { Inventory } from "sketches/mito/inventory";
import { newBaseSpecies } from "../evolution/species";
import { step, World } from "../sketches/mito/game";
import { Environment } from "../sketches/mito/game/environment";
import { Experiment, Visitors } from "./experiment";

class PureChromosomeCell extends Cell {
  public inventory = new Inventory(10, this);
  step(dt: number) {
    this.geneInstances.forEach((g) => step(g, dt));
  }
}

const vascularChromosome = new Chromosome(GeneVascular.level(2));

const allSoilEnvironment: Environment = {
  airEvaporation: 0,
  climate: { rainDuration: 0, timeBetweenRainfall: Infinity, waterPerSecond: 0 },
  fill: (pos, world) => undefined,
  secondsToEvaporate: Infinity,
  floorCo2: 1,
  temperaturePerSeason: [50, 50, 50, 50],
};

function testWorld(width: number, height: number) {
  const world = new World(allSoilEnvironment, 0, newBaseSpecies(), {
    width,
    height,
    growInitialTissue: false,
  });
  for (const t of world.allEnvironmentTiles()) {
    const p = t.pos;
    world.setTileAt(p, new Tissue(p, world));
  }
  world.cellAt(0, 0)!.inventory.set(100, 0);
  return world;
}
function runOneWideAbsolute() {
  const world1 = testWorld(20, 1);
  const visitors: Visitors = {
    time: (t) => t[0].world.time,
  };
  for (const c of world1.allCells()) {
    const pos = c.pos;
    const cell1 = world1.cellAt(pos)!;
    visitors[pos.x] = () => {
      const c1w = cell1.inventory.water;
      return c1w;
    };
  }
  const experiment = new Experiment(visitors);
  console.time("run simulation");
  do {
    if (world1.time % 1 < 0.1) {
      experiment.recordDataFor(Array.from(world1.allCells()));
    }
    world1.step(0.1);
  } while (world1.time <= 10);
  console.timeEnd("run simulation");
  return experiment;
}

function runTwoWideCompare() {
  const world1 = testWorld(20, 1);
  const world2 = testWorld(20, 2);
  const visitors: Visitors = {
    time: (t) => t[0].world.time,
  };
  for (const c of world1.allCells()) {
    const pos = c.pos;
    const cell1 = world1.cellAt(pos)!;
    const cell2 = world2.cellAt(pos)!;
    visitors[pos.x] = () => {
      const c1w = cell1.inventory.water;
      const c2w = cell2.inventory.water;
      // how much faster (or slower) a 2 wide channel goes compared to a one-wide
      return c2w - c1w;
    };
  }
  const experiment = new Experiment(visitors);
  console.time("run simulation");
  do {
    if (world1.time % 1 < 0.1) {
      experiment.recordDataFor(Array.from(world1.allCells()));
    }
    world1.step(0.1);
    world2.step(0.1);
  } while (world1.time <= 10);
  console.timeEnd("run simulation");
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
      const e = runTwoWideCompare();
      plotStackedBar(e, "water-over-time");
    });
    script.addEventListener("error", () => {
      const e1 = runOneWideAbsolute();
      console.table(e1.trials);
      const e2 = runTwoWideCompare();
      console.table(e2.trials);
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
