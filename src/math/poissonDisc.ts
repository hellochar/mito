import { Vector2 } from "three";

// https://github.com/beaugunderson/poisson-disc-sampler/blob/master/poisson-disc-sampler.js
export function poissonDisc({
  width = 1,
  height = 1,
  radius = 0.1,
  max = 1000,
  initialSample = undefined as [number, number] | undefined,
  rng = Math.random,
}): Vector2[] {
  // maximum number of samples before rejection
  var k = 30;
  var radius2 = radius * radius;
  var R = 3 * radius2;
  var cellSize = radius * Math.SQRT1_2;

  var gridWidth = Math.ceil(width / cellSize);
  var gridHeight = Math.ceil(height / cellSize);

  var grid = new Array(gridWidth * gridHeight);

  var queue: number[][] = [];
  var queueSize = 0;

  var sampleSize = 0;

  rng = rng || Math.random;

  function far(x: number, y: number) {
    var i = x / cellSize | 0;
    var j = y / cellSize | 0;

    var i0 = Math.max(i - 2, 0);
    var j0 = Math.max(j - 2, 0);
    var i1 = Math.min(i + 3, gridWidth);
    var j1 = Math.min(j + 3, gridHeight);

    for (j = j0; j < j1; ++j) {
      var o = j * gridWidth;

      for (i = i0; i < i1; ++i) {
        var s;

        if ((s = grid[o + i])) {
          var dx = s[0] - x,
            dy = s[1] - y;

          if (dx * dx + dy * dy < radius2) {
            return false;
          }
        }
      }
    }

    return true;
  }

  function sample(x: number, y: number) {
    const s = [x, y];

    queue.push(s);

    grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;

    sampleSize++;
    queueSize++;

    return s;
  }

  const sampler = function () {
    if (!sampleSize) {
      if (initialSample != null) {
        return sample(initialSample[0], initialSample[1]);
      } else {
        return sample(rng() * width, rng() * height);
      }
    }

    // Pick a random existing sample and remove it from the queue.
    while (queueSize) {
      var i = rng() * queueSize | 0;
      var s = queue[i];

      // Make a new candidate between [radius, 2 * radius] from the existing
      // sample.
      for (var j = 0; j < k; ++j) {
        var a = 2 * Math.PI * rng();
        var r = Math.sqrt(rng() * R + radius2);
        var x = s[0] + r * Math.cos(a);
        var y = s[1] + r * Math.sin(a);

        // Reject candidates that are outside the allowed extent,
        // or closer than 2 * radius to any existing sample.
        if (x >= 0 && x < width && y >= 0 && y < height && far(x, y)) {
          return sample(x, y);
        }
      }

      queue[i] = queue[--queueSize];
      queue.length = queueSize;
    }
  };

  const samples: Vector2[] = [];
  for (let i = 0; i < max; i++) {
    const sample = sampler();
    // we can't get any more
    if (sample == null) {
      break;
    }
    samples.push(new Vector2(sample[0], sample[1]));
  }
  return samples;
};
