import React from "react";
import { Vector2 } from "three";
import { newBaseSpecies } from "../evolution/species";
import { GameResult } from "../sketches/mito";
import { World } from "../sketches/mito/game";
import { Temperate } from "../sketches/mito/game/environment";
import { Fruit } from "../sketches/mito/game/tile";
import GameResultsScreen from "../sketches/mito/ui/GameResultsScreen";

export function TestWinScreen() {
  const world = new World(Temperate(), newBaseSpecies());
  world.time = 150;
  const f1 = new Fruit(new Vector2(0, 0), world);
  f1.committedResources.add(50, 50);
  f1.timeMatured = 250;

  world.time = 479;
  const f2 = new Fruit(new Vector2(0, 0), world);
  f2.committedResources.add(25, 15);

  world.time = 1296;
  const f3 = new Fruit(new Vector2(0, 0), world);
  f3.committedResources.add(50, 50);
  const mockResults: GameResult = {
    status: "won",
    fruits: [f1, f2, f3],
    mutationPointsPerEpoch: 2,
    world,
  };
  return <GameResultsScreen results={mockResults} onDone={() => {}} />;
}
