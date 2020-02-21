import { createModelSchema, primitive } from "serializr";
import { Color, Vector2 } from "three";
createModelSchema(Color, {
  r: primitive(),
  g: primitive(),
  b: primitive(),
});
createModelSchema(Vector2, {
  x: primitive(),
  y: primitive(),
});
