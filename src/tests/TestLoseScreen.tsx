import React from "react";
import { TIME_PER_DAY } from "sketches/mito/game/constants";
import { Vector2 } from "three";
import { newBaseSpecies } from "../evolution/species";
import { GameResult } from "../sketches/mito";
import { World } from "../sketches/mito/game";
import { Temperate } from "../sketches/mito/game/environment";
import { Fruit } from "../sketches/mito/game/tile";
import GameResultsScreen from "../sketches/mito/ui/GameResultsScreen";

export function TestLoseScreen() {
  const world = new World(Temperate, 0, newBaseSpecies());
  world.time = TIME_PER_DAY * 4;
  const f1 = new Fruit(new Vector2(0, 0), world);
  f1.committedResources.add(40, 20);

  world.time = TIME_PER_DAY * 9;
  const f2 = new Fruit(new Vector2(0, 0), world);
  f2.committedResources.add(25, 15);

  world.time = TIME_PER_DAY * 19;
  const f3 = new Fruit(new Vector2(0, 0), world);
  f3.committedResources.add(3, 0);
  const mockResults: GameResult = {
    status: "lost",
    fruits: [f1, f2, f3],
    mutationPointsPerEpoch: 0,
    world,
  };
  return <GameResultsScreen results={mockResults} onDone={() => {}} />;
}
