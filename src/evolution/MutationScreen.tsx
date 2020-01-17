import { useAppReducer } from "app";
import classNames from "classnames";
import generateSpeciesName from "common/generateSpeciesName";
import React from "react";
import Genome from "sketches/mito/game/tile/genome";
import uuid from "uuid";
import { Button } from "../common/Button";
import Character from "../common/Character";
import MP from "../common/MP";
import { Gene } from "./gene";
import GenesToTraits from "./GenesToTraits";
import { mutatePosition, mutateRandomNewGene, mutateSwapDNA } from "./mutation";
import "./MutationScreen.scss";
import { Species } from "./species";

function MutationScreen({
  species,
  onCommit,
}: {
  species: Species;
  onCommit: (newSpecies: Species, newPool: number) => void;
}) {
  const [, dispatch] = useAppReducer();
  // const [pool, setPool] = React.useState(species.freeMutationPoints);
  const pool = species.freeMutationPoints;
  const setPool = (arg: number | ((p: number) => number)) => {
    if (typeof arg === "number") {
      species.freeMutationPoints = arg;
    } else {
      species.freeMutationPoints = arg(pool);
    }
    // TODO if user refreshes while mutating, they'll lose the mutation state!
    // we should save the mutation state in the AppState
    dispatch({
      type: "AAUpdateSpecies",
      species,
    });
  };

  const [newSpecies, setNewSpecies] = React.useState<Species>({
    genome: new Genome(species.genome.cellTypes),
    id: uuid(),
    descendants: [],
    freeMutationPoints: 0,
    totalMutationPoints: 0,
    genes: [...species.genes],
    name: generateSpeciesName(),
    parent: species,
  });

  type ClickModeSwap = {
    type: "swap";
    p1?: { gene: Gene; position: number };
  };
  type ClickModeReroll = {
    type: "reroll";
  };
  type ClickMode = ClickModeSwap | ClickModeReroll | undefined;
  const [clickMode, setClickMode] = React.useState<ClickMode>();
  const isSwapping = clickMode && clickMode.type === "swap";
  const isRerolling = clickMode && clickMode.type === "reroll";

  const newGeneCost = newSpecies.genes.length + 1;

  const handleNewGene = () => {
    setPool((p) => p - newGeneCost);
    setNewSpecies((species) => ({
      ...species,
      genes: [...species.genes, mutateRandomNewGene()],
    }));
  };

  const startSwapClickMode = () => {
    if (isSwapping) {
      setClickMode(undefined);
    } else {
      setClickMode({ type: "swap" });
    }
  };

  const startRerollClickMode = () => {
    if (isRerolling) {
      setClickMode(undefined);
    } else {
      setClickMode({ type: "reroll" });
    }
  };

  function reroll(gene: Gene, position: number) {
    setPool((p) => p - 1);
    setNewSpecies((species) => {
      const geneIndex = species.genes.indexOf(gene);
      const newGene = mutatePosition(gene, position);
      const newGenes = [...species.genes.slice(0, geneIndex), newGene, ...species.genes.slice(geneIndex + 1)];
      return {
        ...species,
        genes: newGenes,
      };
    });
    setClickMode(undefined);
  }

  function swap(gene1: Gene, position1: number, gene2: Gene, position2: number) {
    setPool((p) => p - 2);
    setNewSpecies((species) => {
      const geneIndex1 = species.genes.indexOf(gene1);
      const geneIndex2 = species.genes.indexOf(gene2);

      const newGenes = [...species.genes];

      const [newGene1, newGene2] = mutateSwapDNA(gene1, position1, gene2, position2);
      newGenes[geneIndex1] = newGene1;
      newGenes[geneIndex2] = newGene2;

      return {
        ...species,
        genes: newGenes,
      };
    });
    setClickMode(undefined);
  }

  const handleGeneClick = (gene: Gene, position: number) => {
    if (clickMode) {
      if (clickMode.type === "reroll") {
        reroll(gene, position);
      } else if (clickMode.type === "swap") {
        if (clickMode.p1 == null) {
          clickMode.p1 = { gene, position };
        } else {
          swap(clickMode.p1.gene, clickMode.p1.position, gene, position);
        }
      }
    }
  };

  const handleNewSpeciesName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSpecies((s) => ({
      ...s,
      name: e.target.value,
    }));
  };

  const handleCommit = () => {
    onCommit(newSpecies, pool);
  };

  const isGenesChanged = React.useMemo(() => {
    const genes1 = species.genes;
    const genes2 = newSpecies.genes;

    const isDifferentLengths = genes1.length !== genes2.length;
    return isDifferentLengths || genes1.some((_, i) => genes1[i] !== genes2[i]);
  }, [newSpecies.genes, species.genes]);

  return (
    <div className={classNames("mutation-screen", { "click-mode-active": clickMode != null })}>
      <div className="mutation-screen-content">
        <h1>
          <Character size="medium" />
          <span className="name">{species.name}</span>
        </h1>

        <div className="buttons">
          <MP className="pool" amount={pool} total={species.totalMutationPoints} />
          <Button onClick={handleNewGene} disabled={pool < newGeneCost}>
            New Gene (<MP amount={newGeneCost} />)
          </Button>

          <Button
            className={classNames({ "is-cancel": isSwapping })}
            onClick={startSwapClickMode}
            disabled={(!isSwapping && pool < 2) || newSpecies.genes.length === 0}
          >
            {isSwapping ? (
              "Cancel"
            ) : (
              <>
                Swap DNA (<MP amount={2} />)
              </>
            )}
          </Button>

          <Button
            className={classNames({ "is-cancel": isRerolling })}
            onClick={startRerollClickMode}
            disabled={(!isRerolling && pool < 1) || newSpecies.genes.length === 0}
          >
            {isRerolling ? (
              "Cancel"
            ) : (
              <>
                Re-roll DNA (<MP amount={1} />)
              </>
            )}
          </Button>
        </div>

        <GenesToTraits genes={newSpecies.genes} onClick={handleGeneClick} />
        {isGenesChanged ? (
          <>
            <div className="arrow">⇓</div>
            <h1>
              <Character size="medium" />
              <input type="text" className="name" value={newSpecies.name} onChange={handleNewSpeciesName} />
            </h1>
            <Button className="commit" color="green" onClick={handleCommit}>
              Commit
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default MutationScreen;
