import * as React from "react";

import { GameResult } from "..";
import { Fruit } from "../game/tile";

import "./GameResultsScreen.scss";

function Glow() {
  return (
    <div className="glow">
      <span />
    </div>
  );
}

interface GameResultsScreenProps {
  onDone: () => void;
  results: GameResult;
}

function FruitInfo({ fruit }: { fruit: Fruit }) {
  return (
    <div className="fruit-info">
      <div className="fruit-visual">
        {fruit.isMature() ? <Glow /> : null}
        <img alt="" src="assets/images/fruit.png" />
      </div>
      {fruit.isMature() ? (
        <>
          <span className="matured-info success">Matured</span>&nbsp;at {fruit.timeMatured}, Mutation Points earned: 1
        </>
      ) : (
        <span className="matured-info in-progress">{(fruit.getPercentMatured() * 100).toFixed(0)}% maturity</span>
      )}
      , started {fruit.timeMade}.
    </div>
  );
}

function GameWonScreen({ results }: GameResultsScreenProps) {
  const matureFruit = results.fruits.filter((f) => f.isMature());
  return (
    <>
      <div className="character-party-container">
        <img alt="" className="character" src="assets/images/character.png"></img>
      </div>
      <h1>You {matureFruit.length >= 3 ? "thrived" : "survived"}!</h1>
      <h2>{matureFruit.length} Mutation Points earned.</h2>
      <h5>Fruit Made</h5>
      <div className="fruit-list">
        {results.fruits.map((f) => (
          <FruitInfo fruit={f} />
        ))}
      </div>
    </>
  );
}

function GameLostScreen({ results }: GameResultsScreenProps) {
  return (
    <>
      <h1>You died!</h1>
      <div>You survived until {results.world.season.name}!</div>
    </>
  );
}

export default function GameResultsScreen({ onDone, results }: GameResultsScreenProps) {
  return (
    <div className={`game-results-screen ${results.status}`}>
      <div className="game-results-content">
        {results.status === "won" ? (
          <GameWonScreen onDone={onDone} results={results} />
        ) : (
          <GameLostScreen onDone={onDone} results={results} />
        )}
        <button className="done-button" onClick={onDone}>
          Continue →
        </button>
      </div>
    </div>
  );
}
