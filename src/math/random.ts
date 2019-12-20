import * as THREE from "three";

/**
 * Return a Vector2 that's uniformly randomly chosen from the perimeter
 * of the rectangle given by min and max.
 */
export function randomRectPerimeter(min: THREE.Vector2, max: THREE.Vector2): THREE.Vector2 {
  const width = max.x - min.x;
  const height = max.y - min.y;
  let x: number;
  let y: number;
  if (Math.random() * (width + height) < width) {
    // we've chosen the top or bottom line
    x = THREE.Math.randFloat(min.x, max.x);
    y = Math.random() < 0.5 ? min.y : max.y;
  } else {
    // we've chosen the left or right line
    x = Math.random() < 0.5 ? min.x : max.x;
    y = THREE.Math.randFloat(min.y, max.y);
  }
  return new THREE.Vector2(x, y);
}
