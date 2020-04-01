import classNames from "classnames";
import Keyboard from "game/input/keyboard";
import { WorldDOMComponent } from "game/mito/WorldDOMElement";
import TileHighlight from "game/tutorial/tileHighlight";
import * as React from "react";
import { Tile } from "../../../core/tile";
import Mito from "../../mito/mito";
import BuildBlueprint from "../../tutorial/buildBlueprint";
import PointHighlight from "../../tutorial/PointHighlight";
import "./Hover.scss";

interface HoverProps {
  mito: Mito;
}

export class Hover extends React.Component<HoverProps> {
  get scene() {
    return this.props.mito.scene;
  }

  public render() {
    const isTakingLongAction = this.props.mito.world.player.isTakingLongAction();
    const isUsingShift = Keyboard.keyMap.has("ShiftLeft");
    if (isTakingLongAction || isUsingShift) {
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
    const leftClickType = mito.toolBar.leftClick(tile)?.type;
    const showBuildBlueprint = leftClickType === "pickup" || leftClickType === "drop";
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
    if (action != null && action.type === "build") {
      const isBuildValid = mito.world.player.canBuildAt(tile);
      return (
        <>
          <WorldDOMComponent
            className={classNames("build-drop-shadow", { valid: isBuildValid })}
            mito={mito}
            positionFn={() => tile}
          ></WorldDOMComponent>
          <BuildBlueprint x={tile.pos.x} y={tile.pos.y} cellType={action.cellType} scene={this.props.mito.scene} />
        </>
      );
    }
  }
}
