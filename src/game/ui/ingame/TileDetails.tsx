/* eslint-disable jsx-a11y/accessible-emoji */
import { nf } from "common/formatters";
import * as React from "react";
import { GiDustCloud } from "react-icons/gi";
import { CancerEffect, CellEffectConstructor } from "../../../core/cell/cellEffect";
import { Gene } from "../../../core/cell/gene";
import { GeneInstance } from "../../../core/cell/geneInstance";
import { describeCellInteraction } from "../../../core/cell/genome";
import { Air, Cell, Fountain, FreezeEffect, GrowingCell, Soil, Tile } from "../../../core/tile";
import { GeneLiving, GeneSoilAbsorption, SoilAbsorptionState } from "../../../std/genes";
import { GenePhotosynthesis, PhotosynthesisState } from "../../../std/genes/GenePhotosynthesis";
import { GeneFruit, GeneSeed, ReproducerState } from "../../../std/genes/GeneReproducer";
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
          <div className="interact-info">Right click - more options.</div>
        </div>
      );
    }
  }

  private cellInfo(tile: Tile) {
    if (tile instanceof Cell) {
      const living = tile.findGene(GeneLiving);
      const secondsPerUpkeep = living?.props.secondsPerUpkeep;
      const secondsRemaining = secondsPerUpkeep != null ? tile.energy * secondsPerUpkeep : null;
      const energyEl =
        secondsRemaining != null ? (
          <div className="info-energy">
            💚&nbsp;{nf(tile.energy * 100, 2)}% Energy ({Math.floor(secondsRemaining)} seconds remaining)
          </div>
        ) : null;
      return (
        <>
          {energyEl}
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
        {cell.geneInstances.map((gene, index) => {
          if (gene.isType(GeneSoilAbsorption)) {
            return <React.Fragment key={index}>{this.soilAbsorptionInfo(gene.state)}</React.Fragment>;
          } else if (gene.isType(GenePhotosynthesis)) {
            return <React.Fragment key={index}>{this.photosynthesisInfo(gene.state)}</React.Fragment>;
          } else if (gene.isType(GeneFruit) || gene.isType(GeneSeed)) {
            return <React.Fragment key={index}>{this.reproducerInfo(gene)}</React.Fragment>;
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
        {nf(state.energyRecieved, 3)}/{props.neededEnergy} energy absorbed.
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
    return (
      <div className="info-tile">
        <div className="info-tile-row">
          <div className="info-tile-name">{tile.displayName}</div>
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
            return `${nf(e.percentFrozen * 100, 2)}% ${name}!`;
          } else if (e instanceof CancerEffect) {
            return `${name}! ${nf(e.timeToDuplicate, 2)}s until spread.`;
          } else {
            return name;
          }
        })
        .join(", ");
      return <div className="info-cell-effects">{descriptors}</div>;
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
