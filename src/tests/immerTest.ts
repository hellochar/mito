import produce from "immer";
import { Genome } from "./DndTest";

function immerTest() {
  const state0: Genome = [
    {
      name: "cell1",
      genes: [1, 2, 3],
    },
    {
      name: "cell2",
      genes: [4, 5],
    },
  ];

  const state1 = produce(state0, (draft) => {
    draft[0].name = "foobar";
    const [gene] = draft[0].genes.splice(1, 1);
    draft[1].genes.splice(0, 0, gene);
  });

  console.log(state0);
  console.log(state1);
}

export default immerTest;
