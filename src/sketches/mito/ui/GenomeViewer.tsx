import classNames from "classnames";
import DynamicNumber from "common/DynamicNumber";
import LookAtMouse from "common/LookAtMouse";
import { arrayRange } from "math/arrays";
import * as React from "react";
import { FaGripLines } from "react-icons/fa";
import { RealizedGene } from "../game/tile/chromosome";
import Genome, { CellType } from "../game/tile/genome";
import { spritesheetLoaded } from "../spritesheet";
import "./GenomeViewer.scss";
import IconCell from "./IconCell";

interface DragInfo {
  gene: RealizedGene;
  cellType: CellType;
}

interface DragState {
  dragged?: DragInfo;
}

type DragStateTupleType = [DragState, React.Dispatch<React.SetStateAction<DragState>>];
const DraggedContext = React.createContext<DragStateTupleType>(null!);

const GenomeViewer: React.FC<{ genome: Genome }> = ({ genome }) => {
  const tuple = React.useState<DragState>({});
  return (
    <DraggedContext.Provider value={tuple}>
      <div className="genome-viewer">
        <div className="cell-types">
          {genome.cellTypes.map((c) => (
            <CellTypeViewer cellType={c} />
          ))}
        </div>
      </div>
    </DraggedContext.Provider>
  );
};

const CellTypeViewer: React.FC<{ cellType: CellType }> = ({ cellType }) => {
  const { chromosome, geneSlots, name } = cellType;
  const [dragState, setDragState] = React.useContext(DraggedContext);
  const handleDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (dragState.dragged != null) {
        const { gene, cellType: leavingCellType } = dragState.dragged;
        leavingCellType.chromosome.genes = leavingCellType.chromosome.genes.filter((g) => g !== gene);
        cellType.chromosome.genes.push(gene);
        setDragState({});
      }
    },
    [cellType.chromosome.genes, dragState.dragged, setDragState]
  );
  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);
  return (
    <div className="cell-type">
      <div className="cell-header">
        <IconCell cellType={cellType.c} spritesheetLoaded={spritesheetLoaded} />
        <div>
          <h2>{name}</h2>
          {chromosome.geneSlotsUsed()}/{geneSlots} gene slots used
        </div>
      </div>
      <div className="chromosome" onDragOver={handleDragOver} onDrop={handleDrop}>
        {chromosome.genes.map((g) => (
          <GeneViewer cellType={cellType} gene={g} />
        ))}
      </div>
    </div>
  );
};

const GeneViewer: React.FC<{ cellType: CellType; gene: RealizedGene }> = ({ cellType, gene }) => {
  const [dragState, setDragState] = React.useContext(DraggedContext);
  const { gene: gd, level } = gene;
  const handleDragStart = React.useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData("mito/gene", "data");
      setDragState({
        dragged: {
          cellType,
          gene,
        },
      });
    },
    [cellType, gene, setDragState]
  );
  return (
    <LookAtMouse zScale={10} displayBlock>
      <div className="gene" draggable onDragStart={handleDragStart}>
        <div className="gene-header">
          <span className="gene-cost">
            <DynamicNumber value={gene.getCost()} speed={0.5} />
          </span>
          <h4>
            {gd.blueprint.name}
            {/* {level + 1} */}
          </h4>
          {/* <div className="buttons">
            <button className="up" onClick={() => gene.changeLevel(level + 1)}>
              <FaArrowUp />
            </button>
            <button className="down" onClick={() => gene.changeLevel(level - 1)}>
              <FaArrowDown />
            </button>
          </div> */}
          <FaGripLines className="grip-lines" />
        </div>
        <div className="gene-level-picker">
          {arrayRange(5).map((i) => (
            <button className={classNames({ selected: gene.level === i })} onClick={() => gene.changeLevel(i)}>
              {i}
            </button>
          ))}
        </div>
        <p className="description">{gd.blueprint.description(gene.getProps(), gene.getStaticProperties())}</p>
      </div>
    </LookAtMouse>
  );
};

export default GenomeViewer;
