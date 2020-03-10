import TileHighlight from "game/tutorial/tileHighlight";
import * as React from "react";
import { Tile } from "../../../core/tile";
import Mito from "../../mito/mito";
import BuildBlueprint from "../../tutorial/buildBlueprint";
import PointHighlight from "../../tutorial/PointHighlight";

interface HoverProps {
  mito: Mito;
}

export class Hover extends React.Component<HoverProps> {
  get scene() {
    return this.props.mito.scene;
  }

  public render() {
    const isTakingLongAction = this.props.mito.world.player.isTakingLongAction();
    if (isTakingLongAction) {
      return null;
    }
    const { highlightedTile } = this.props.mito;
    const highlightedPosition = this.props.mito.getHighlightPosition();
    return (
      <>
        <PointHighlight x={highlightedPosition.x} y={highlightedPosition.y} scene={this.scene} />
        {this.maybeRenderBuildBlueprint(highlightedTile)}
        {this.maybeRenderTileHighlight(highlightedTile)}
        {/* {this.maybeRenderPath()} */}
      </>
    );
  }

  public maybeRenderTileHighlight(tile?: Tile) {
    if (tile == null) {
      return;
    }
    const { mito } = this.props;
    const showBuildBlueprint = mito.toolBar.leftClick(tile)?.type === "interact";
    const tileHighlight = showBuildBlueprint ? (
      <TileHighlight x={tile.pos.x} y={tile.pos.y} scene={this.props.mito.scene} />
    ) : null;
    return tileHighlight;
  }

  public maybeRenderBuildBlueprint(tile?: Tile) {
    if (tile == null) {
      return;
    }
    const { mito } = this.props;
    const action = mito.toolBar.leftClick(tile);
    const buildElement =
      action != null && action.type === "build" ? (
        <BuildBlueprint x={tile.pos.x} y={tile.pos.y} cellType={action.cellType} scene={this.props.mito.scene} />
      ) : null;
    return buildElement;
  }
}
