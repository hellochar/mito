export function roundCubeCoordinates(i: number, j: number, k: number) {
  var rx = Math.round(i);
  var ry = Math.round(j);
  var rz = Math.round(k);

  var x_diff = Math.abs(rx - i);
  var y_diff = Math.abs(ry - j);
  var z_diff = Math.abs(rz - k);

  if (x_diff > y_diff && x_diff > z_diff) {
    rx = -ry - rz;
  } else if (y_diff > z_diff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  return { i: rx, j: ry, k: rz };
}

