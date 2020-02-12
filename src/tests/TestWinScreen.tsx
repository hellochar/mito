import { GameResult } from "game/gameResult";
import React from "react";
import { GeneFruit } from "sketches/mito/game/tile/genes/GeneReproducer";
import { standardGenome } from "sketches/mito/game/tile/standardGenome";
import { Vector2 } from "three";
import { newBaseSpecies } from "../core/species";
import { World } from "../sketches/mito/game";
import { Temperate } from "../sketches/mito/game/environment";
import { Cell } from "../sketches/mito/game/tile";
import GameResultsScreen from "../sketches/mito/ui/GameResultsScreen";

export function mockFruit(world: World, percent: number, timeMatured?: number) {
  const cellTypeFruit = standardGenome.cellTypes[4];
  const cell = new Cell(new Vector2(0, 0), world, cellTypeFruit);
  const fruit = cell.findGene(GeneFruit)!;
  fruit.state.committedResources.add(
    (fruit.props.neededResources * percent) / 2,
    (fruit.props.neededResources * percent) / 2
  );
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
    world,
  };
  return <GameResultsScreen results={mockResults} onDone={() => {}} />;
}
