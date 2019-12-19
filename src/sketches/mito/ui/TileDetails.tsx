/* eslint-disable jsx-a11y/accessible-emoji */
import * as React from "react";
import { Constructor } from "../constructor";
import { CELL_MAX_ENERGY } from "../game/constants";
import { Air, Cell, CellEffect, Fountain, FreezeEffect, GrowingCell, hasEnergy, Leaf, Root, Tile } from "../game/tile";
import { hasInventory } from "../inventory";
import TemperatureInfo from "./TemperatureInfo";
import "./TileDetails.scss";

interface TileDetailsProps {
  tile?: Tile;
}

export class TileDetails extends React.Component<TileDetailsProps> {
  public render() {
    const { tile } = this.props;
    if (!tile) {
      return null;
    }
    return (
      <div className="tile-hover">
        {this.tileInfo(tile)}
        {this.inventoryInfo(tile)}
        {this.cellInfo(tile)}
        {this.growingCellInfo(tile)}
        {this.rootInfo(tile)}
        {this.leafInfo(tile)}
        {this.airInfo(tile)}
        {this.fountainInfo(tile)}
      </div>
    );
  }
  private rootInfo(tile: Tile) {
    return tile instanceof Root ? (
      <div className="info-root">
        <div>{tile.totalSucked} water collected.</div>
        <div>{tile.cooldown.toFixed(0)} turns until next water suck.</div>
        {/* <div>{tile.waterTransferAmount.toFixed(0)} water transfer per round.</div> */}
      </div>
    ) : null;
  }
  private leafInfo(tile: Tile) {
    return tile instanceof Leaf ? (
      <div className="info-leaf">
        <div>{tile.totalSugarProduced} sugar produced.</div>
        <div>{(1 / (tile.averageSpeed * tile.reactionRate())).toFixed(2)} seconds per reaction.</div>
        <div>{(1 / tile.averageEfficiency).toFixed(2)} water per sugar.</div>
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

  private fountainInfo(tile: Tile) {
    if (tile instanceof Fountain) {
      return (
        <div className="info-fountain">
          <div>{tile.secondsPerWater} turns per water</div>
        </div>
      );
    }
  }

  private tileInfo(tile: Tile) {
    const energyInfo = hasEnergy(tile) ? (
      <span className="info-energy">💚{((tile.energy / CELL_MAX_ENERGY) * 100).toFixed(0)}%</span>
    ) : null;
    return (
      <div className="info-tile">
        <div className="info-tile-row">
          <div className="info-tile-name">{(tile.constructor as Constructor<Tile>).displayName}</div>
          {energyInfo}
          <TemperatureInfo tile={tile} />
        </div>
      </div>
    );
  }

  private inventoryInfo(tile: Tile) {
    if (hasInventory(tile)) {
      const waterInfo =
        tile.inventory.water > 0 ? (
          <div className="info-inventory-item">💧 {tile.inventory.water.toFixed(2)}</div>
        ) : null;
      const sugarInfo =
        tile.inventory.sugar > 0 ? (
          <div className="info-inventory-item">Sugar {tile.inventory.sugar.toFixed(2)}</div>
        ) : null;
      return (
        <div className="info-inventory">
          {waterInfo}
          {sugarInfo}
        </div>
      );
    }
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
