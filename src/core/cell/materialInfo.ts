import { createSimpleSchema, object } from "serializr";
import { Color, Vector2 } from "three";

export interface MaterialInfo {
  /**
   * If unspecified, means white but respect transparency
   */
  color?: Color;

  texturePosition: Vector2;
}

export const MaterialInfoSchema = createSimpleSchema({
  color: object(Color),
  texturePosition: object(Vector2),
});
