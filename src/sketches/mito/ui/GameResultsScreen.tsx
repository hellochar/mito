import fruitSrc from "assets/images/fruit.png";
import classNames from "classnames";
import MP from "common/MP";
import { map } from "math";
import * as React from "react";
import Character from "../../../common/Character";
import { mitoDeath } from "../audio";
import { GameResult } from "../game/gameResult";
import { seasonDisplay, seasonFromTime } from "../game/Season";
import { Cell } from "../game/tile";
import { GeneInstance } from "../game/tile/chromosome";
import { GeneFruit, reproducerGetPercentMatured } from "../game/tile/genes/GeneReproducer";
import "./GameResultsScreen.scss";
import { Glow } from "./Glow";

interface GameResultsScreenProps {
  onDone: () => void;
  results: GameResult;
}

function FruitResult({ fruit, mpEarned }: { fruit: GeneInstance<GeneFruit>; mpEarned: number }) {
  const scale = map(reproducerGetPercentMatured(fruit), 0, 1, 0.2, 1);
  const style = React.useMemo(() => {
    return {
      transform: `scale(${scale})`,
    };
  }, [scale]);
  return (
    <div className="fruit-info">
      <div className="fruit-visual">
        {fruit.state.isMature ? <Glow /> : null}
        <img alt="" src={fruitSrc} style={style} />
      </div>
      {fruit.state.timeMatured != null ? (
        <>
          <span className="matured-info success">
            +<MP amount={mpEarned} />
          </span>
          &nbsp;at {seasonDisplay(seasonFromTime(fruit.state.timeMatured))}, Mutation Points earned: 1
        </>
      ) : (
        <span className="matured-info in-progress">
          {(reproducerGetPercentMatured(fruit) * 100).toFixed(0)}% maturity
        </span>
      )}
      , started at {seasonDisplay(seasonFromTime(fruit.cell.timeMade))}.
    </div>
  );
}

function ReproductiveCellResult({ cell, mpEarned }: { cell: Cell; mpEarned: number }) {
  const fruit = cell.findGene(GeneFruit);
  if (fruit != null) {
    return <FruitResult fruit={fruit} mpEarned={mpEarned} />;
  } else {
    return (
      <div>
        {cell.toString()} +<MP amount={mpEarned} />
      </div>
    );
  }
}

function MPEarnerList({ results, className }: { results: GameResult; className?: string }) {
  return (
    <div className={classNames("mp-earner-list", className)}>
      <h5>Reproductive Cells</h5>
      <div>
        {Array.from(results.mpEarners.entries()).map(([cell, mpEarned]) => (
          <ReproductiveCellResult cell={cell} mpEarned={mpEarned} />
        ))}
      </div>
    </div>
  );
}

function GameWonScreen({ results }: GameResultsScreenProps) {
  const winDescription =
    Array.from(results.mpEarners.entries()).filter(([c, mp]) => mp > 0).length < 3 ? "survived" : "thrived";
  return (
    <>
      <div className="character-container">
        <Character size="large" className="dance" />
      </div>
      <h1>You {winDescription}!</h1>
      <h2>{results.mutationPointsPerEpoch} Mutation Points earned.</h2>
      <MPEarnerList results={results} />
    </>
  );
}

function GameLostScreen({ results }: GameResultsScreenProps) {
  React.useEffect(() => {
    mitoDeath.play();
    return () => {
      mitoDeath.stop();
    };
  }, []);
  return (
    <>
      <div className="character-container">
        <Character className="sad" size="large" />
      </div>
      <h1>
        <i>{results.world.species.name}</i> couldn't survive!
      </h1>
      <div>You survived until {seasonDisplay(results.world.season)}!</div>
      <MPEarnerList results={results} className="dark" />
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
