import classnames from "classnames";
import * as React from "react";

import Mito from "../index";
import { params } from "../params";
import CellBar from "./CellBar";
import { TIME_PER_YEAR, Season } from "../game";

import "./SeasonsTracker.scss";
import { TraitType } from "../../../evolution/traits";
import TraitDisplay from "../../../evolution/TraitDisplay";

function BarMarker({ percent }: { percent: number }) {
  const style = {
    left: `${(percent * 100).toFixed(2)}%`,
  };
  return <div className="bar-marker" style={style} />;
}

function SeasonBead({ percent }: { percent: number }) {
  const style = {
    left: `${(percent * 100).toFixed(2)}%`,
  };
  return <div className="season-bead" style={style} />;
}

function capitalize(s: String) {
  return s.substr(0, 1).toLocaleUpperCase() + s.substr(1);
}

function SeasonsTracker({ time, season }: { time: number; season: Season }) {
  const yearDonePercent = time / TIME_PER_YEAR;
  const month = Math.floor(season.percent * 3) + 1;
  return (
    <div className="seasons-tracker">
      <div className="container">
        <div className="end-brace" />
        <div className="bar">
          <BarMarker percent={0.25} />
          <BarMarker percent={0.5} />
          <BarMarker percent={0.75} />
          <SeasonBead percent={yearDonePercent} />
        </div>
        <div className="end-brace" />
      </div>
      <div>
        {capitalize(season.name)}, Month {month}
      </div>
    </div>
  );
}

export interface HUDProps {
  mito: Mito;
}

export interface HUDState {
  traitsPanelOpen: boolean;
}

export class HUD extends React.Component<HUDProps, HUDState> {
  state: HUDState = {
    traitsPanelOpen: true,
  };

  get mito() {
    return this.props.mito;
  }

  get world() {
    return this.mito.world;
  }

  get player() {
    return this.world.player;
  }

  get inventory() {
    return this.player.inventory;
  }

  private isTutorialFinished() {
    return this.mito.tutorialRef == null ? true : this.mito.tutorialRef.isFinished();
  }

  public render() {
    const isMaxed = this.inventory.isMaxed();
    const isMaxedEl = <div className={`mito-inventory-maxed${isMaxed ? " is-maxed" : ""}`}>maxed</div>;
    return (
      <>
        <SeasonsTracker time={this.world.time} season={this.world.season} />
        {this.maybeRenderTraits()}
        <div className={classnames("mito-inventory", { hidden: false })}>
          {isMaxedEl}
          <div className="mito-inventory-container">
            {this.renderInventoryBar()}
            {this.renderInventory()}
          </div>
          <CellBar
            bar={this.mito.cellBar}
            index={this.mito.cellBarIndex}
            onIndexClicked={(i) => this.mito.setCellBarIndex(i)}
          />
        </div>
      </>
    );
  }

  maybeRenderTraits() {
    if (this.state.traitsPanelOpen) {
      return (
        <div
          style={{
            position: "absolute",
            right: 10,
            top: 50,
            textAlign: "left",
            background: "white",
            padding: 10,
          }}
        >
          <TraitDisplay traits={this.world.traits} />
        </div>
      );
    }
  }

  renderInventory() {
    return (
      <div className="mito-inventory-indicator">
        <span className="mito-inventory-water">{this.inventory.water.toFixed(2)} water</span>
        &nbsp;
        <span className="mito-inventory-sugar">{this.inventory.sugar.toFixed(2)} sugar</span>
      </div>
    );
  }

  renderInventoryBar() {
    const waterPercent = this.inventory.water / params.maxResources;
    const sugarPercent = this.inventory.sugar / params.maxResources;
    const emptyPercent = 1 - (this.inventory.water + this.inventory.sugar) / params.maxResources;
    const waterStyles: React.CSSProperties = {
      width: `${waterPercent * 100}%`,
    };
    const sugarStyles: React.CSSProperties = {
      width: `${sugarPercent * 100}%`,
    };
    const emptyStyles: React.CSSProperties = {
      width: `${emptyPercent * 100}%`,
    };
    const inventoryBar = (
      <div className="mito-inventory-bar">
        <div style={waterStyles} className="mito-inventory-bar-water"></div>
        <div style={sugarStyles} className="mito-inventory-bar-sugar"></div>
        <div style={emptyStyles} className="mito-inventory-bar-empty"></div>
      </div>
    );
    return inventoryBar;
  }
}
