import mitoDeathMp3 from "assets/audio/mitodeath.mp3";
import fruitSrc from "assets/images/fruit.png";
import classNames from "classnames";
import { map } from "math";
import * as React from "react";
import { GameResult } from "..";
import Character from "../../../common/Character";
import { seasonDisplay, seasonFromTime } from "../game/Season";
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
  const scale = map(fruit.getPercentMatured(), 0, 1, 0.2, 1);
  const style = React.useMemo(() => {
    return {
      transform: `scale(${scale})`,
    };
  }, [scale]);
  return (
    <div className="fruit-info">
      <div className="fruit-visual">
        {fruit.isMature() ? <Glow /> : null}
        <img alt="" src={fruitSrc} style={style} />
      </div>
      {fruit.timeMatured != null ? (
        <>
          <span className="matured-info success">Matured</span>&nbsp;at{" "}
          {seasonDisplay(seasonFromTime(fruit.timeMatured))}, Mutation Points earned: 1
        </>
      ) : (
        <span className="matured-info in-progress">{(fruit.getPercentMatured() * 100).toFixed(0)}% maturity</span>
      )}
      , built at {seasonDisplay(seasonFromTime(fruit.timeMade))}.
    </div>
  );
}

function FruitList({ results, className }: { results: GameResult; className?: string }) {
  return (
    <div className={classNames("fruit-list", className)}>
      <h5>Fruit Made</h5>
      <div>
        {results.fruits.map((f) => (
          <FruitInfo fruit={f} />
        ))}
      </div>
    </div>
  );
}

function GameWonScreen({ results }: GameResultsScreenProps) {
  const matureFruit = results.fruits.filter((f) => f.isMature());
  return (
    <>
      <div className="character-container">
        <Character size="large" className="dance" />
      </div>
      <h1>You {matureFruit.length >= 3 ? "thrived" : "survived"}!</h1>
      <h2>{results.mutationPointsPerEpoch} Mutation Points earned.</h2>
      <FruitList results={results} />
    </>
  );
}

function GameLostScreen({ results }: GameResultsScreenProps) {
  return (
    <>
      <audio src={mitoDeathMp3} autoPlay loop />
      <div className="character-container">
        <Character className="sad" size="large" />
      </div>
      <h1>
        <i>{results.world.species.name}</i> couldn't survive!
      </h1>
      <div>You survived until {seasonDisplay(results.world.season)}!</div>
      <FruitList results={results} className="dark" />
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
