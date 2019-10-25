/* eslint-disable jsx-a11y/accessible-emoji */
import * as React from "react";
import { Constructor } from "../constructor";
import { Air, Cell, CellEffect, Fountain, GrowingCell, hasEnergy, Leaf, Root, Tile } from "../game/tile";
import { hasInventory } from "../inventory";
import { params } from "../params";


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
        <div>{tile.cooldown} turns until next water suck.</div>
        <div>{tile.waterTransferAmount.toFixed(0)} water transfer per round.</div>
      </div>
    ) : null;
  }
  private leafInfo(tile: Tile) {
    return tile instanceof Leaf ? (
      <div className="info-leaf">
        <div>{tile.totalSugarProduced} sugar produced.</div>
        <div>{(1 / (tile.averageSpeed * params.leafReactionRate)).toFixed(0)} turns per reaction.</div>
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
          <div>{tile.turnsPerWater} turns per water</div>
        </div>
      );
    }
  }

  private tileInfo(tile: Tile) {
    const energyInfo = hasEnergy(tile) ? (
      <span className="info-energy">💚{((tile.energy / params.cellEnergyMax) * 100).toFixed(0)}%</span>
    ) : null;
    return (
      <div className="info-tile">
        <div className="info-tile-name">{(tile.constructor as Constructor<Tile>).displayName}</div>
        <div className="info-tile-temperature">{tile.temperature.toFixed(2)}</div>
        {energyInfo}
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
          {tile.effects.length > 0 ? <div className="info-cell">{this.cellEffectNames(tile.effects)}</div> : null}
        </>
      );
    }
  }

  private cellEffectNames(effects: CellEffect[]) {
    return effects.map((e) => (e.constructor as Constructor<CellEffect>).displayName).join(", ");
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
