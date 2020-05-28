import { GameResult } from "game/gameResult";
import React from "react";
import { Temperate } from "std/environments";
import { GeneFruit } from "std/genes/GeneReproducer";
import { standardGenome } from "std/genomes/standardGenome";
import { Vector2 } from "three";
import { World } from "../core";
import { newBaseSpecies } from "../core/species";
import { Cell } from "../core/tile";
import GameResultsScreen from "../game/screens/GameResultsScreen";

export function mockFruit(world: World, percent: number, timeMatured?: number) {
  const cellTypeFruit = standardGenome.cellTypes[4];
  const cell = new Cell(new Vector2(0, 0), world, cellTypeFruit);
  const fruit = cell.findGene(GeneFruit)!;
  fruit.state.energyRecieved = fruit.props.neededResources * percent;
  fruit.state.timeMatured = timeMatured;
  fruit.state.isMature = percent === 1;
  return cell;
}

export function TestWinScreen() {
  const world = new World(Temperate, 0, newBaseSpecies());
  const f1 = mockFruit(world, 1, 250);
  const f2 = mockFruit(world, 0.4);
  const f3 = mockFruit(world, 1, 900);
  const mockResults: GameResult = {
    status: "won",
    mpEarners: new Map([
      [f1, 3],
      [f2, 0],
      [f3, 3],
    ]),
    mutationPointsPerEpoch: 6,
    oxygenContribution: 0,
    world,
  };
  return <GameResultsScreen results={mockResults} onDone={() => {}} />;
}
