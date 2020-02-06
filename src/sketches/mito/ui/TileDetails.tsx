/* eslint-disable jsx-a11y/accessible-emoji */
import { nf } from "common/formatters";
import * as React from "react";
import { GiDustCloud } from "react-icons/gi";
import { Air, Cell, Fountain, FreezeEffect, GrowingCell, Soil, Tile } from "../game/tile";
import { CellEffectConstructor } from "../game/tile/cellEffect";
import { Gene, GeneInstance } from "../game/tile/chromosome";
import { GeneSoilAbsorption, SoilAbsorptionState } from "../game/tile/genes";
import { GenePhotosynthesis, PhotosynthesisState } from "../game/tile/genes/GenePhotosynthesis";
import { GeneFruit, GeneSeed, ReproducerState } from "../game/tile/genes/GeneReproducer";
import { describeCellInteraction } from "../game/tile/genome";
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
        {this.airInfo(tile)}
        {this.soilInfo(tile)}
        {this.fountainInfo(tile)}
        {this.interactInfo(tile)}
      </div>
    );
  }

  private interactInfo(tile: Tile) {
    if (tile instanceof Cell) {
      const leftClickEl =
        tile.type.interaction != null ? (
          <div className="interact-info first">Left click - {describeCellInteraction(tile.type.interaction)}.</div>
        ) : null;
      return (
        <div className="interact-infos">
          {leftClickEl}
          <div className="interact-info">Right click - deconstruct.</div>
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
          {this.geneInfos(tile)}
        </>
      );
    }
  }

  private geneInfos(cell: Cell) {
    return (
      <>
        {cell.geneInstances.map((gene) => {
          if (gene.isType(GeneSoilAbsorption)) {
            return this.soilAbsorptionInfo(gene.state);
          } else if (gene.isType(GenePhotosynthesis)) {
            return this.photosynthesisInfo(gene.state);
          } else if (gene.isType(GeneFruit) || gene.isType(GeneSeed)) {
            return this.reproducerInfo(gene);
          } else {
            return null;
          }
        })}
      </>
    );
  }

  private soilAbsorptionInfo(state: SoilAbsorptionState) {
    return (
      <div className="info-root">
        <div>Absorbs in {formatSeconds(state.cooldown)}.</div>
        <div>{state.totalSucked.toFixed(1)} total water absorbed so far.</div>
      </div>
    );
  }

  private photosynthesisInfo(state: PhotosynthesisState) {
    return (
      <div className="info-leaf">
        <div>{(state.averageChancePerSecond * 100).toFixed(1)}% chance to photosynthesize per second.</div>
        <div>{(1 / state.averageConversionRate).toFixed(2)} water per sugar.</div>
        <div>{state.totalSugarProduced.toFixed(2)} total sugar produced so far.</div>
      </div>
    );
  }

  private reproducerInfo(instance: GeneInstance<Gene<ReproducerState, any>>) {
    const { state, props } = instance;
    return (
      <div>
        <div>
          {nf(state.committedResources.water, 3)}/{props.neededResources / 2} water consumed.
        </div>
        <div>
          {nf(state.committedResources.sugar, 3)}/{props.neededResources / 2} sugar consumed.
        </div>
      </div>
    );
  }

  private airInfo(tile: Tile) {
    if (tile instanceof Air) {
      return (
        <div className="info-air">
          <div>☀️ {nf(tile.sunlight() * 100, 2)}%</div>
          <div>
            <GiDustCloud /> {nf((1 - tile.co2()) * 100, 2)}%
          </div>
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
      tile instanceof Cell ? <span className="info-energy">💚&nbsp;{(tile.energy * 100).toFixed(0)}%</span> : null;
    return (
      <div className="info-tile">
        <div className="info-tile-row">
          <div className="info-tile-name">{tile.displayName}</div>
          {energyInfo}
          <TemperatureInfo tile={tile} />
          <InventoryBar
            water={tile.inventory.water}
            sugar={tile.inventory.sugar}
            capacity={tile.inventory.capacity}
            format="icons"
            colored={false}
            capacityBasedWidth
          />
        </div>
      </div>
    );
  }

  private cellEffects(cell: Cell) {
    const { effects } = cell;
    if (effects.length > 0) {
      const descriptors = effects
        .map((e) => {
          const name = (e.constructor as CellEffectConstructor).displayName;
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
      return <div className="info-growing-cell">{nf(tile.percentMatured * 100, 2)}% mature</div>;
    }
  }
}
