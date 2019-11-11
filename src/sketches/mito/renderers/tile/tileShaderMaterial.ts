import { ShaderMaterial } from "three";
import glsl from "../glsl";

const vertexShader = glsl`
`;

const fragmentShader = glsl`
`;

const TileShaderMaterial = new ShaderMaterial({
  uniforms: {},
  vertexShader,
  fragmentShader,
});

export default TileShaderMaterial;
