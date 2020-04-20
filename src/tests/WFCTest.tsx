import produce from "immer";
import { minBy } from "lodash";
import { randInt } from "math";
import { arrayRange, gridRange } from "math/arrays";
import React, { useCallback, useMemo, useState } from "react";

type Id = number;

/**
 * Each element should be an integer [0, N], one member of our tileset.
 *
 * e.g. 0 = water, 1 = land, 2 = mountain
 *
 * [[0, 2, 1],
 *  [0, 1, 2],
 *  [1, 2, 1]
 * ]
 */
type Grid = Id[][];

type UncollapsedGrid = (RelationWeights | number)[][];

function grid(width: number, height: number): Grid {
  return gridRange(width, height, () => 0);
}

const charMap: Record<Id, string> = {
  0: "~",
  1: "·",
  2: "🌳",
  3: "🏯",
};
function gridToReact(g: Grid, onClick?: (event: React.MouseEvent) => void): JSX.Element {
  return (
    <div className="grid">
      {g.map((row, x) => (
        <div className="row">
          {row.map((id, y) => (
            <span grid-x={x} grid-y={y} className={"tile" + String(id)} onClick={onClick}>
              {charMap[id]}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

const initialSrcGrid = g(`
210000000
211111110
222222210
211111110
222211110
223222210
222222210
211111110
210000000
`);

const WFCTest = () => {
  const [srcGrid, setSrcGrid] = useState(initialSrcGrid);
  const [id, setId] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const output = useMemo(() => wfc(srcGrid, 25, 25), [srcGrid, id]);

  const outputReact = useMemo(() => gridToReact(output), [output]);
  const upId = useCallback(() => setId((id) => id + 1), []);

  const handleSrcClick = useCallback((event: React.MouseEvent) => {
    const x = Number(event.currentTarget.attributes.getNamedItem("grid-x")!.value);
    const y = Number(event.currentTarget.attributes.getNamedItem("grid-y")!.value);
    setSrcGrid((srcGrid) =>
      produce(srcGrid, (srcGrid) => {
        srcGrid[x][y] = (srcGrid[x][y] + 1) % NUM_IDS;
      })
    );
  }, []);
  const outputSrcReact = useMemo(() => gridToReact(srcGrid, handleSrcClick), [handleSrcClick, srcGrid]);

  return (
    <div className="container">
      <div className="source">
        <h2>Source</h2>
        {outputSrcReact}
      </div>
      <div className="output">
        <button onClick={upId} style={{ padding: "1em 0.5em", fontSize: 20, margin: 20 }}>
          New
        </button>
        {outputReact}
      </div>
    </div>
  );
};

function g(s: string) {
  return s
    .trim()
    .split("\n")
    .map((row) => row.split("").map((char) => Number(char)));
}

let NUM_IDS = 4;
let IDS_LIST = arrayRange(NUM_IDS);

function wfc(grid: Grid, outWidth: number, outHeight: number): Grid {
  console.log = () => {};
  const gridFlat = grid.flat();
  // NUM_IDS = new Set(gridFlat).size;
  // IDS_LIST = arrayRange(NUM_IDS);
  // first, extract neighbor weights from input
  const relationModel = newRelationModel(grid);

  const globalAppearanceWeights: RelationWeights = newRelationWeights(NUM_IDS);
  gridFlat.forEach((id) => (globalAppearanceWeights[id] = (globalAppearanceWeights[id] ?? 0) + 1));
  normalizeWeights(globalAppearanceWeights);

  console.log(relationModel, globalAppearanceWeights);

  function tryCollapseGrid(): Grid | undefined {
    // start with a uncollapsed grid
    const uncollapsedGrid: UncollapsedGrid = gridRange(outWidth, outHeight, () => globalAppearanceWeights.slice());

    // pick a random point to start off
    // when point is null, then we've successfully collapsed!
    let point: Point | null = { x: randInt(0, outWidth - 1), y: randInt(0, outHeight - 1) };
    // actually we want a minheap. Key is `${x},${y}` of a point. Value is that point's entropy.
    const frontier: Map<string, number> = new Map();
    let iter = 0;
    do {
      console.log("---iteration " + iter + "----");
      const id = collapseGridPoint(uncollapsedGrid, point);
      if (id == null) {
        // we hit a degenerate case, fail the entire tryCollapseGrid attempt
        console.log("degenerate! grid:", uncollapsedGrid, "frontier:", frontier);
        return;
      }
      frontier.delete(`${point.x},${point.y}`);

      // return true if weights updated, false if neighbor became degenerate
      function updateNeighborWeights(x: number, y: number, relationWeights: RelationWeights) {
        const neighborWeights = uncollapsedGrid[x]?.[y];
        // ignore out of bounds or already collapsed
        if (neighborWeights == null || typeof neighborWeights === "number") {
          return;
        }

        // // to update: dot product the current uncollapsed state with the passed in relation weights
        // const newWeights = dot(neighborWeights, relationWeights);

        // to update: zero out incompatible neighbors
        const newWeights = arrayRange(neighborWeights.length, (i) =>
          relationWeights[i] === 0 ? 0 : neighborWeights[i]
        );

        // if we've hit a zero case on a neighbor, the entropy will be 0 and it will be caught in the next run anyways
        if (!isZero(newWeights)) {
          normalizeWeights(newWeights);
        }

        uncollapsedGrid[x][y] = newWeights;
        // now, update the frontier. Be sure to normalize
        console.log("setting frontier", `${x},${y}`, entropy(newWeights));
        frontier.set(`${x},${y}`, entropy(newWeights));
      }

      // update neighbors
      updateNeighborWeights(point.x, point.y - 1, relationModel.get(id)!.n);
      updateNeighborWeights(point.x, point.y + 1, relationModel.get(id)!.s);
      updateNeighborWeights(point.x - 1, point.y, relationModel.get(id)!.w);
      updateNeighborWeights(point.x + 1, point.y, relationModel.get(id)!.e);

      function pickNextPoint(): Point | null {
        if (frontier.size === 0) {
          return null;
        }
        // find the minimal entropy point from the frontier
        const [nextPointStr] = minBy(Array.from(frontier.entries()), ([point, entropy]) => entropy)!;
        const [xStr, yStr] = nextPointStr.split(",");
        return {
          x: Number(xStr),
          y: Number(yStr),
        };
      }
      point = pickNextPoint();
      iter++;
    } while (point != null);
    console.log("made grid after iter", iter);
    return uncollapsedGrid as Grid;
  }

  let attempt = 0;
  let output: Grid | undefined;
  for (; output == null; attempt++) {
    output = tryCollapseGrid();
  }

  // now, collapse the grid of possibilities.
  return output!;
}

/**
 * Entropy is a calcuation of how much "randomness" the tile has.
 *
 * A weight like [0.01, 0.99] has low entropy - it's very likely to be Tile 1.
 * A weight of [0.5, 0.5] would have higher entropy.
 * A weight of [0.3, 0.3, 0.4] would have even higher entropy, since there's even more possibilities.
 *
 * // so - more weights = higher entropy
 * // more difference between the weights = higher entropy
 *
 * but, something like [0.01, 0.01, 0.98] still has *low entropy*, even lower than [0.5, 0.5]
 *
 * first pass:
 * log(numWeights) * weightVariance ? maybe?
 *
 * Wikipedia defines it as:
 * -sum( weight[i] * log(weight[i]) )
 *
 * this article at https://robertheaton.com/2018/12/17/wavefunction-collapse-algorithm/ suggests:
 * log(sum(weight)) - (sum(weight * log(weight)) / sum(weight))
 *
 */
function entropy(weights: RelationWeights): number {
  let e = 0;
  weights.forEach((w) => {
    if (w !== 0) {
      e += -(w * Math.log(w));
    }
  });
  // we have to remove the 0 weights
  if (isNaN(e)) {
    throw new Error("NaN entropy");
  }
  return e;
}

function dot(a: RelationWeights, b: RelationWeights): RelationWeights {
  if (a.length !== b.length) {
    throw new Error("dot product length mismatch");
  }
  return arrayRange(a.length, (i) => a[i] * b[i]);
}

function isZero(weights: RelationWeights) {
  return weights.every((w) => w === 0);
}

type Point = { x: number; y: number };

function collapseGridPoint(uncollapsedGrid: UncollapsedGrid, point: Point): Id | undefined {
  const weights = uncollapsedGrid[point.x][point.y];
  if (typeof weights === "number") {
    debugger;
    throw new Error("Collapsing an already collapsed point!");
  }
  if (isZero(weights)) {
    return;
  }
  normalizeWeights(weights);
  const sample = collapse(weights);
  uncollapsedGrid[point.x][point.y] = sample;
  console.log("collapsing", point, "with weights", weights, "to", sample);
  return sample;
}

function collapse(weights: RelationWeights) {
  return weightedSample(IDS_LIST, weights);
}

function newRelationModel(grid: Grid) {
  const relationModel: RelationModel = new Map();

  function maybeCountNeighbor(x: number, y: number, array: RelationWeights) {
    const id: number | undefined = grid[x]?.[y];
    if (id != null) {
      // count +1 to the weight for the neighbor
      array[id] = (array[id] ?? 0) + 1;
    }
  }
  function countWeight(i: number, j: number, id: Id) {
    if (!relationModel.has(id)) {
      relationModel.set(id, {
        s: newRelationWeights(NUM_IDS),
        e: newRelationWeights(NUM_IDS),
        n: newRelationWeights(NUM_IDS),
        w: newRelationWeights(NUM_IDS),
      });
    }
    const relations = relationModel.get(id)!;

    maybeCountNeighbor(i, j - 1, relations.n);
    maybeCountNeighbor(i, j + 1, relations.s);
    maybeCountNeighbor(i - 1, j, relations.w);
    maybeCountNeighbor(i + 1, j, relations.e);
  }
  // iterate through input and build relation model
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      countWeight(i, j, grid[i][j]);
    }
  }

  // normalize weights
  // SPECIAL CASE - sometimes relations are all 0's (e.g. boundary tiles)
  // in this case, use a uniform distribution
  for (const [id, relations] of relationModel) {
    normalizeOrUniformWeights(relations.n);
    normalizeOrUniformWeights(relations.e);
    normalizeOrUniformWeights(relations.s);
    normalizeOrUniformWeights(relations.w);
  }

  return relationModel;
}

function normalizeOrUniformWeights(arr: RelationWeights) {
  if (isZero(arr)) {
    arr.fill(1 / arr.length);
  } else {
    normalizeWeights(arr);
  }
}

function normalizeWeights(arr: RelationWeights) {
  const sum = arr.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    throw new Error("normalizing a zero weight!");
  }
  for (let i = 0; i < arr.length; i++) {
    arr[i] = arr[i] / sum;
  }
}

/**
 * Index is the tile type id, maps to the N/E/S/W relations for that id.
 */
type RelationModel = Map<Id, NeighborRelations>;

interface NeighborRelations {
  n: RelationWeights;
  s: RelationWeights;
  e: RelationWeights;
  w: RelationWeights;
}

/**
 * Index is the tile type id, value is the weight for that type.
 */
type RelationWeights = number[];

function newRelationWeights(length: number) {
  return new Array(length).fill(0);
}

export default WFCTest;

function weightedSample<T>(arr: T[], weights: number[]) {
  if (arr.length !== weights.length) {
    throw new RangeError("Chance: Length of array and weights must match");
  }

  // scan weights array and sum valid entries
  var sum = 0;
  var val;
  for (var weightIndex = 0; weightIndex < weights.length; ++weightIndex) {
    val = weights[weightIndex];
    if (isNaN(val)) {
      val = 0;
    }

    if (val > 0) {
      sum += val;
    }
  }

  if (sum === 0) {
    throw new RangeError("Chance: No valid entries in array weights");
  }

  // select a value within range
  var selected = Math.random() * sum;

  // find array entry corresponding to selected value
  var total = 0;
  var lastGoodIdx = -1;
  var chosenIdx!: number;
  for (weightIndex = 0; weightIndex < weights.length; ++weightIndex) {
    val = weights[weightIndex];
    total += val;
    if (val > 0) {
      if (selected <= total) {
        chosenIdx = weightIndex;
        break;
      }
      lastGoodIdx = weightIndex;
    }

    // handle any possible rounding error comparison to ensure something is picked
    if (weightIndex === weights.length - 1) {
      chosenIdx = lastGoodIdx;
    }
  }

  var chosen = arr[chosenIdx];

  return chosen;
}
