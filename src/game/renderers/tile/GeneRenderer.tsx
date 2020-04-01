import { Gene } from "core/cell/gene";
import { GeneInstance } from "core/cell/geneInstance";
import { Renderer } from "../Renderer";
import { InstancedTileRenderer } from "./InstancedTileRenderer";

export abstract class GeneRenderer<G extends Gene = Gene> extends Renderer<GeneInstance<G>> {
  constructor(t: GeneInstance<G>, public tileRenderer: InstancedTileRenderer) {
    super(t, tileRenderer.scene, tileRenderer.mito);
    this.init();
  }

  init() {}

  abstract hover?(): void;
}
