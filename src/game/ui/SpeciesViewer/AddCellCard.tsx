import Chromosome from "core/cell/chromosome";
import { useAppReducer } from "game/app";
import React from "react";
import { IoIosAddCircleOutline } from "react-icons/io";
import { Color, Vector2 } from "three";
import Genome, { CellType } from "../../../core/cell/genome";

export const AddCellCard: React.FC<{
  genome: Genome;
}> = ({ genome }) => {
  // const [state, setState] = React.useContext(DraggedContext);
  const [, dispatch] = useAppReducer();
  const handleAddCell = React.useCallback(() => {
    const newCellType = new CellType(
      "Cell " + (genome.cellTypes.length + 1),
      0,
      new Chromosome(),
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
    dispatch({ type: "AAUpdateSpecies" });
  }, [dispatch, genome.cellTypes]);
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
