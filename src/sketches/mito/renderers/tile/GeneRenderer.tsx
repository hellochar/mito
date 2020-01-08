import { Gene, GeneInstance } from "sketches/mito/game/tile/chromosome";
import { Renderer } from "../Renderer";

export abstract class GeneRenderer<G extends Gene = Gene> extends Renderer<GeneInstance<G>> {
  abstract hover(): void;
}
