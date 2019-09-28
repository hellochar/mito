import * as React from "react";
import styled from "styled-components";

import { GameResult } from "..";

interface GameResultsScreenProps {
  onDone: () => void;
  results: GameResult;
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  font-size: 40px;
`;

function GameWonScreen({ results }: GameResultsScreenProps) {
  return (
    <>
      <h1>You won!</h1>
      <div>
        Mutation Points: {results.mutationPointsEarned}
      </div>
      <div>
        Fruit Made: {results.fruitMade}
      </div>
    </>
  );
}

function GameLostScreen({ results }: GameResultsScreenProps) {
  return (
    <>
      <h1>You died!</h1>
      <div>
        You survived until {results.world.season.name}!
      </div>
    </>
  );
}

export default function GameResultsScreen({ onDone, results }: GameResultsScreenProps) {
  return (
    <Container>
      { results.status === "won" ?
        <GameWonScreen onDone={onDone} results={results} /> :
        <GameLostScreen onDone={onDone} results={results} />
      }
      <button onClick={onDone}>Done</button>
    </Container>
  );
}
