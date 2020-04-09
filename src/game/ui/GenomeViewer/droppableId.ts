import { CellType } from "core/cell";
import Genome from "core/cell/genome";

export function droppableIdToCell(state: Genome, droppableId: string): CellType | undefined {
  return state.cellTypes.find(({ name }) => name === droppableId);
}

export function cellToDroppableId(cell: CellType): string {
  return cell.name;
}
