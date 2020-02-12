import classNames from "classnames";
import { nf } from "common/formatters";
import DynamicNumber from "game/ui/common/DynamicNumber";
import { arrayRange } from "math/arrays";
import * as React from "react";
import { FaArrowsAltV, FaGripLines } from "react-icons/fa";
import { TiThMenu } from "react-icons/ti";
import { GeneStaticProperties, RealizedGene } from "../../../core/cell/chromosome";
import Genome, { CellInteraction, CellType, describeCellInteraction } from "../../../core/cell/genome";
import { spritesheetLoaded } from "../spritesheet";
import "./GenomeViewer.scss";
import IconCell from "./IconCell";

interface DragInfo {
  gene: RealizedGene;
  cellType: CellType;
}

interface GenomeViewerState {
  dragged?: DragInfo;
  view: "small" | "expanded";
}

type GenomeViewerStateTupleType = [GenomeViewerState, React.Dispatch<React.SetStateAction<GenomeViewerState>>];
const DraggedContext = React.createContext<GenomeViewerStateTupleType>(null!);

const GenomeViewer: React.FC<{ genome: Genome }> = ({ genome }) => {
  const tuple = React.useState<GenomeViewerState>({ view: "small" });
  const [state, setState] = tuple;
  const handleViewSmall = React.useCallback(() => {
    setState((s) => ({ ...s, view: "small" }));
  }, [setState]);
  const handleViewExpanded = React.useCallback(() => {
    setState((s) => ({ ...s, view: "expanded" }));
  }, [setState]);

  return (
    <DraggedContext.Provider value={tuple}>
      <div className={classNames("genome-viewer", { dragging: state.dragged != null })}>
        <div className="view-switcher">
          <TiThMenu onClick={handleViewSmall} className={classNames("", { active: state.view === "small" })} />
          <FaArrowsAltV
            onClick={handleViewExpanded}
            className={classNames("", { active: state.view === "expanded" })}
          />
        </div>
        <div className="cell-types">
          {genome.cellTypes.map((c) => (
            <CellTypeViewer key={c.name} cellType={c} />
          ))}
        </div>
      </div>
    </DraggedContext.Provider>
  );
};

const CellTypeViewer: React.FC<{ cellType: CellType }> = ({ cellType }) => {
  const { chromosome, name } = cellType;
  const [state, setState] = React.useContext(DraggedContext);
  const handleDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (state.dragged != null) {
        const { gene, cellType: leavingCellType } = state.dragged;
        leavingCellType.chromosome.genes = leavingCellType.chromosome.genes.filter((g) => g !== gene);
        cellType.chromosome.genes.push(gene);
        setState((s) => ({ ...s, dragged: undefined }));
      }
    },
    [cellType.chromosome.genes, state.dragged, setState]
  );
  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // const additionalGeneSlots = chromosome.geneSlotsAdded();
  // const totalGeneSlotsEl = (
  //   <>
  //     {geneSlots}
  //     {additionalGeneSlots > 0 ? `+${additionalGeneSlots}` : null}
  //   </>
  // );

  const handleSetInteraction = React.useCallback(
    (i: CellInteraction | undefined) => {
      cellType.interaction = i;
    },
    [cellType.interaction]
  );
  return (
    <div className="cell-type">
      <div className="cell-header">
        <IconCell cellType={cellType} spritesheetLoaded={spritesheetLoaded} />
        <div>
          <h2>{name}</h2>
          <CellInteractionSelector
            key={cellType.name}
            interaction={cellType.interaction}
            setInteraction={handleSetInteraction}
          />
          {/* <StaticPropertiesViewer {...chromosome.mergeStaticProperties()} /> */}
        </div>
      </div>
      <div className="gene-slots">
        Gene Slots Available:{" "}
        <span className="slots-used">
          <DynamicNumber value={chromosome.geneSlotsNet()} />
        </span>
      </div>
      <div className="chromosome" onDragOver={handleDragOver} onDrop={handleDrop}>
        {chromosome.genes.map((g, i) => (
          <GeneViewer key={i} cellType={cellType} gene={g} />
        ))}
      </div>
    </div>
  );
};

const interactionTypes = ["give", "take"] as const;
const resourceTypes = ["water", "sugar", "water and sugar"] as const;
const possibleInteractions: CellInteraction[] = interactionTypes.flatMap((type) =>
  resourceTypes.map((resources) => ({
    type,
    resources,
  }))
);
possibleInteractions.push(
  {
    type: "give",
    resources: "water take sugar",
  },
  {
    type: "give",
    resources: "sugar take water",
  }
);
export const CellInteractionSelector: React.FC<{
  interaction?: CellInteraction;
  setInteraction: (i: CellInteraction | undefined) => void;
}> = React.memo(({ interaction, setInteraction }) => {
  const handleSelect = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const indexOrUndefined = event.target.value;
      if (indexOrUndefined == null) {
        setInteraction(undefined);
        // cellType.interaction = undefined;
      } else {
        setInteraction(possibleInteractions[Number(indexOrUndefined)]);
        // cellType.interaction = possibleInteractions[Number(indexOrUndefined)];
      }
    },
    [setInteraction]
  );
  const selectValue =
    interaction == null
      ? undefined
      : possibleInteractions.findIndex((i) => interaction.resources === i.resources && interaction.type === i.type);
  const interactionEl = (
    <select className="interaction-select" onChange={handleSelect} value={selectValue}>
      <option value={undefined}>do nothing</option>
      {possibleInteractions.map((interaction, index) => {
        return (
          <option key={index} value={index}>
            {describeCellInteraction(interaction)}
          </option>
        );
      })}
    </select>
  );
  return <div className="interaction-select-container">Left-click to {interactionEl}.</div>;
});

export const StaticPropertiesViewer: React.FC<GeneStaticProperties> = React.memo(
  ({ diffusionWater, diffusionSugar, inventoryCapacity, isDirectional, isObstacle, isReproductive }) => {
    return (
      <div className="static-properties">
        {diffusionWater !== 0 ? (
          <span className="diffusion-water">
            Diffusion Water <b>{nf(diffusionWater, 4)}</b>
          </span>
        ) : null}
        {diffusionSugar !== 0 ? (
          <span className="diffusion-sugar">
            Diffusion Sugar <b>{nf(diffusionSugar, 4)}</b>
          </span>
        ) : null}
        <span className="diffusion-rate">Inventory {inventoryCapacity}</span>
        {isDirectional ? <span className="directional">Directional</span> : null}
        {isReproductive ? <span className="reproductive">Reproductive</span> : null}
        {isObstacle ? <span className="obstacle">Obstacle</span> : null}
      </div>
    );
  }
);

const GeneViewer: React.FC<{ cellType: CellType; gene: RealizedGene }> = ({ cellType, gene }) => {
  const [state, setState] = React.useContext(DraggedContext);
  const { gene: gd } = gene;
  const handleDragStart = React.useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData("mito/gene", "data");
      setState((s) => ({
        ...s,
        dragged: {
          cellType,
          gene,
        },
      }));
    },
    [cellType, gene, setState]
  );
  const cost = gene.getCost();
  const draggable = !(gene.gene.blueprint.name === "Living" || gene.gene.blueprint.name === "Inventory");
  return (
    // <LookAtMouse zScale={8} displayBlock>
    <div
      className={classNames("gene", state.view, gd.blueprint.name.replace(" ", ""), { draggable })}
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <div className="gene-header">
        <GeneCost cost={cost} />
        <h4>
          {gd.blueprint.name}
          {/* <span style={{ opacity: 0.5 }}>{gene.level + 1}</span> */}
          {/* <div className="gene-level-arrows">
              <button className="up" onClick={() => gene.setLevel(level + 1)}>
                <FaArrowUp />
              </button>
              <button className="down" onClick={() => gene.setLevel(level - 1)}>
                <FaArrowDown />
              </button>
            </div> */}
        </h4>
        {draggable ? <FaGripLines className="grip-lines" /> : null}
      </div>
      {gene.gene.blueprint.levelCosts.length > 1 ? (
        <div className="gene-level-picker">
          {arrayRange(gene.gene.blueprint.levelCosts.length).map((i) => (
            <button key={i} className={classNames({ selected: gene.level === i })} onClick={() => gene.setLevel(i)}>
              {i + 1}
              {/* <span className="gene-cost">{gene.gene.blueprint.levelCosts[i]}</span> */}
            </button>
          ))}
        </div>
      ) : null}
      <div className="description">{gd.blueprint.description(gene.getProps(), gene.getStaticProperties())}</div>
    </div>
    // </LookAtMouse>
  );
};

function GeneCost({ cost, className, ...props }: { cost: number } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={classNames("gene-cost", className, {
        negative: cost < 0,
      })}
    >
      {cost < 0 ? "+" : null}
      <DynamicNumber value={Math.abs(cost)} speed={0.5} />
    </span>
  );
}

export default GenomeViewer;
