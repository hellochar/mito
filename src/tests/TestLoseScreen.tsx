import { TIME_PER_DAY } from "core/constants";
import { GameResult } from "game/gameResult";
import React from "react";
import { Temperate } from "std/environments";
import { newBaseSpecies } from "../core/species";
import { World } from "../sketches/mito/game";
import GameResultsScreen from "../sketches/mito/ui/GameResultsScreen";
import { mockFruit } from "./TestWinScreen";

export function TestLoseScreen() {
  const world = new World(Temperate, 0, newBaseSpecies());
  world.time = TIME_PER_DAY * 4;
  const f1 = mockFruit(world, 0.4);
  world.time = TIME_PER_DAY * 9;
  const f2 = mockFruit(world, 0.3);
  world.time = TIME_PER_DAY * 19;
  const f3 = mockFruit(world, 0.01459);
  const mockResults: GameResult = {
    mpEarners: new Map([
      [f1, 0],
      [f2, 0],
      [f3, 0],
    ]),
    status: "lost",
    mutationPointsPerEpoch: 0,
    world,
  };
  return <GameResultsScreen results={mockResults} onDone={() => {}} />;
}
