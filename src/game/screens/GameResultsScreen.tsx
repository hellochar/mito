import { Slider } from "@blueprintjs/core";
import fruitSrc from "assets/images/fruit.png";
import classNames from "classnames";
import MP from "game/ui/common/MP";
import { map } from "math";
import * as React from "react";
import { GeneInstance } from "../../core/cell/geneInstance";
import { seasonDisplay, seasonFromTime } from "../../core/season";
import { Cell } from "../../core/tile";
import { GeneFruit, reproducerGetPercentMatured } from "../../std/genes/GeneReproducer";
import { mitoDeath } from "../audio";
import { GameResult } from "../gameResult";
import Character from "../ui/common/Character";
import { Glow } from "../ui/common/Glow";
import "./GameResultsScreen.scss";

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

function MPEarnerList({ mpEarners, className }: { mpEarners: Map<Cell, number>; className?: string }) {
  if (mpEarners.size > 0) {
    return (
      <div className={classNames("mp-earner-list", className)}>
        <h5>Reproductive Cells</h5>
        <div>
          {Array.from(mpEarners.entries()).map(([cell, mpEarned]) => (
            <ReproductiveCellResult cell={cell} mpEarned={mpEarned} />
          ))}
        </div>
      </div>
    );
  } else {
    return null;
  }
}

function VignetteList({ vignettes }: { vignettes?: HTMLCanvasElement[] | undefined }) {
  const [index, setIndex] = React.useState(0);
  if (vignettes) {
    return (
      <div className="vignette-viewer">
        <Slider
          className="slider"
          value={index}
          min={0}
          stepSize={1}
          max={vignettes.length - 1}
          onChange={setIndex}
          showTrackFill={false}
          labelRenderer={(val) => `Day ${val + 1}`}
        />
        <div className="current-vignette">
          <img src={vignettes[index].toDataURL()} alt="" />
        </div>
      </div>
    );
  } else {
    return null;
  }
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
      <VignetteList vignettes={results.vignettes} />
      <MPEarnerList mpEarners={results.mpEarners} />
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
      <VignetteList vignettes={results.vignettes} />
      <MPEarnerList mpEarners={results.mpEarners} className="dark" />
    </>
  );
}

const GameResultsScreen: React.FC<GameResultsScreenProps> = React.memo(({ onDone, results }) => {
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
});

export default GameResultsScreen;
