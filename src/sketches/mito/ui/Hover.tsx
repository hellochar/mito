import * as React from "react";
import Mito from "..";
import { Tile } from "../game/tile";
import BuildBlueprint from "../tutorial/buildBlueprint";
import PointHighlight from "../tutorial/PointHighlight";

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
        {this.maybeRenderTileHighlight(highlightedTile)}
        {/* {this.maybeRenderPath()} */}
      </>
    );
  }

  public maybeRenderTileHighlight(tile?: Tile) {
    if (tile == null) {
      return;
    }
    const showBuildBlueprint = this.props.mito.world.player.canBuildAt(tile) && !this.props.mito.isAltHeld();
    const buildElement = showBuildBlueprint ? (
      <BuildBlueprint
        x={tile.pos.x}
        y={tile.pos.y}
        cellType={this.props.mito.actionBar.buildBar.selectedCell}
        scene={this.props.mito.scene}
      />
    ) : null;
    if (buildElement != null) {
      return buildElement;
    }
    return (
      <>
        {/* <TileHighlight x={tile.pos.x} y={tile.pos.y} scene={this.scene} /> */}
        {buildElement}
      </>
    );
  }

  // public maybeRenderPath() {
  //   const { autoplace, hoveredTile, scene, world } = this.props.mito;
  //   if (hoveredTile) {
  //     if (autoplace != null && Mito.expansionTiles.indexOf(autoplace) !== -1) {
  //       return <PathHighlight tile={hoveredTile} scene={scene} world={world} walkable="non-obstacles" />;
  //     }
  //     if (autoplace === Transport) {
  //       return <PathHighlight tile={hoveredTile} scene={scene} world={world} walkable="tissue" />;
  //     }
  //   }
  // }
}

// class PathHighlight extends React.PureComponent<{ world: World, tile: Tile, scene: THREE.Scene, walkable: "tissue" | "non-obstacles" }> {
//   render() {
//     const path = this.props.walkable === "non-obstacles"
//       ? findPositionsThroughNonObstacles(this.props.world, this.props.tile.pos)
//       : findPositionsThroughTissue(this.props.world, this.props.tile.pos);
//     return <>
//       {path.map(([x, y]) => <TileHighlight x={x} y={y} scene={this.props.scene} />)}
//     </>;
//   }
// }
