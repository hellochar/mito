import classNames from "classnames";
import Keyboard from "game/input/keyboard";
import { WorldDOMComponent } from "game/mito/WorldDOMElement";
import TileHighlight from "game/tutorial/tileHighlight";
import * as React from "react";
import { findBuildCandidateTiles } from "std/worldUtils";
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
    let { highlightedPosition, highlightedTile } = this.props.mito;
    if (this.props.mito.isPaused) {
      highlightedTile = this.props.mito.getTileAtScreen();
    }
    return (
      <>
        {highlightedPosition ? (
          <PointHighlight x={highlightedPosition.x} y={highlightedPosition.y} scene={this.scene} />
        ) : null}
        {this.maybeRenderBuildBlueprint(highlightedTile)}
        {this.maybeRenderTileHighlight(highlightedTile)}
        {this.maybeRenderTutorialBuildHighlights(highlightedTile)}
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
    const { mito } = this.props;
    if (tile == null || mito.isPaused) {
      return;
    }
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

  maybeRenderTutorialBuildHighlights(tile?: Tile) {
    const { mito } = this.props;
    if (tile == null || mito.isPaused || !mito.isFirstPlaythrough) {
      return;
    }
    const action = mito.toolBar.leftClick(tile);
    if (action != null && action.type === "build") {
      const buildCandidateHighlights: JSX.Element[] = [];
      for (const candidate of findBuildCandidateTiles(this.props.mito.world)) {
        buildCandidateHighlights.push(
          <TileHighlight
            key={candidate.pos.x + "," + candidate.pos.y}
            x={candidate.pos.x}
            y={candidate.pos.y}
            scene={this.scene}
          />
        );
      }
      return buildCandidateHighlights;
    }
  }
}
