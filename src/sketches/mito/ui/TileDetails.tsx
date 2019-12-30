/* eslint-disable jsx-a11y/accessible-emoji */
import * as React from "react";
import { Constructor } from "../constructor";
import { CELL_MAX_ENERGY } from "../game/constants";
import { Air, Cell, CellEffect, Fountain, FreezeEffect, GrowingCell, Leaf, Root, Soil, Tile } from "../game/tile";
import { InventoryBar } from "./InventoryBar";
import TemperatureInfo from "./TemperatureInfo";
import "./TileDetails.scss";

interface TileDetailsProps {
  tile?: Tile;
}

function formatSeconds(seconds: number, fractionDigits = 1) {
  return `${Math.max(0, seconds).toFixed(fractionDigits)}s`;
}

export class TileDetails extends React.Component<TileDetailsProps> {
  public render() {
    const { tile } = this.props;
    if (!tile) {
      return null;
    }
    return (
      <div className="tile-details">
        {this.tileInfo(tile)}
        {this.cellInfo(tile)}
        {this.growingCellInfo(tile)}
        {this.rootInfo(tile)}
        {this.leafInfo(tile)}
        {this.airInfo(tile)}
        {this.soilInfo(tile)}
        {this.fountainInfo(tile)}
      </div>
    );
  }
  private rootInfo(tile: Tile) {
    return tile instanceof Root ? (
      <div className="info-root">
        <div>Absorbs in {formatSeconds(tile.cooldown)}.</div>
        <div>{tile.totalSucked.toFixed(1)} total water absorbed so far.</div>
      </div>
    ) : null;
  }
  private leafInfo(tile: Tile) {
    return tile instanceof Leaf ? (
      <div className="info-leaf">
        <div>{formatSeconds(1 / (tile.averageSpeed * tile.reactionRate()), 2)} per reaction.</div>
        <div>{(1 / tile.averageConversionRate).toFixed(2)} water per sugar.</div>
        <div>{tile.totalSugarProduced.toFixed(2)} total sugar produced so far.</div>
      </div>
    ) : null;
  }
  private airInfo(tile: Tile) {
    if (tile instanceof Air) {
      return (
        <div className="info-air">
          <div>☀️ {(tile.sunlight() * 100).toFixed(0)}%</div>
          <div>☁️ {(tile.co2() * 100).toFixed(0)}%</div>
        </div>
      );
    }
  }

  private soilInfo(tile: Tile) {
    if (tile instanceof Soil) {
      return (
        <div className="info-soil">
          <div>Depth {tile.depth}.</div>
        </div>
      );
    }
  }

  private fountainInfo(tile: Tile) {
    if (tile instanceof Fountain) {
      return (
        <div className="info-fountain">
          <div>{formatSeconds(tile.cooldown)} until next water.</div>
          <div>{tile.waterRemaining} water left.</div>
        </div>
      );
    }
  }

  private tileInfo(tile: Tile) {
    const energyInfo =
      tile instanceof Cell ? (
        <span className="info-energy">💚{((tile.energy / CELL_MAX_ENERGY) * 100).toFixed(0)}%</span>
      ) : null;
    return (
      <div className="info-tile">
        <div className="info-tile-row">
          <div className="info-tile-name">{(tile.constructor as Constructor<Tile>).displayName}</div>
          {energyInfo}
          <TemperatureInfo tile={tile} />
          <InventoryBar
            water={tile.inventory.water}
            sugar={tile.inventory.sugar}
            capacity={tile.inventory.capacity}
            format="icons"
            capacityBasedWidth
          />
        </div>
      </div>
    );
  }

  private cellInfo(tile: Tile) {
    if (tile instanceof Cell) {
      return (
        <>
          {tile.droopY * 200 > 1 ? <div className="info-cell">{(tile.droopY * 200).toFixed(0)}% droop</div> : null}
          {this.cellEffects(tile)}
        </>
      );
    }
  }

  private cellEffects(cell: Cell) {
    const { effects } = cell;
    if (effects.length > 0) {
      const descriptors = effects
        .map((e) => {
          const name = (e.constructor as Constructor<CellEffect>).displayName;
          if (e instanceof FreezeEffect) {
            return `${(e.percentFrozen * 100).toFixed(0)}% ${name}`;
          } else {
            return name;
          }
        })
        .join(", ");
      return <div className="info-cell">{descriptors}</div>;
    } else {
      return null;
    }
  }

  private growingCellInfo(tile: Tile) {
    if (tile instanceof GrowingCell) {
      return (
        <div className="info-growing-cell">
          {(100 - (tile.timeRemaining / tile.timeToBuild) * 100).toFixed(0)}% mature
        </div>
      );
    }
  }
}
