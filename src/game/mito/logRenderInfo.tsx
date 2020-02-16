import { WebGLRenderer } from "three";

export function logRenderInfo(renderer: WebGLRenderer) {
  console.log(`Geometries in memory: ${renderer.info.memory.geometries}
Textures in memory: ${renderer.info.memory.textures}
Number of Programs: ${renderer.info.programs!.length}
# Render Calls: ${renderer.info.render.calls}
# Render Lines: ${renderer.info.render.lines}
# Render Points: ${renderer.info.render.points}
# Render Tris: ${renderer.info.render.triangles}
`);
}
