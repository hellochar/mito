import { Color, Vector2 } from "three";
export interface MaterialInfo {
  /**
   * If unspecified, means white but respect transparency
   */
  color?: Color;
  texturePosition: Vector2;
}