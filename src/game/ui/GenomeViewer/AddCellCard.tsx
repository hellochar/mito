import Chromosome from "core/cell/chromosome";
import React from "react";
import { IoIosAddCircleOutline } from "react-icons/io";
import { Color, Vector2 } from "three";
import Genome, { CellType } from "../../../core/cell/genome";

export const AddCellCard: React.FC<{
  genome: Genome;
}> = ({ genome }) => {
  // const [state, setState] = React.useContext(DraggedContext);
  const handleAddCell = React.useCallback(() => {
    const newCellType = new CellType(
      "Cell " + (genome.cellTypes.length + 1),
      0,
      Chromosome.basic(),
      {
        texturePosition: new Vector2(1, 1),
        color: new Color(Math.random(), Math.random(), Math.random()),
      },
      {
        type: "give",
        resources: "water and sugar",
      }
    );
    genome.cellTypes.push(newCellType);
  }, [genome.cellTypes]);
  return (
    <div className="add-cell-card">
      <div className="add-cell" onClick={handleAddCell}>
        Add Cell
      </div>
      <button onClick={handleAddCell}>
        <IoIosAddCircleOutline />
      </button>
    </div>
  );
};
