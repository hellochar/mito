import classnames from "classnames";
import * as React from "react";

import { Fruit } from "../game/tile";
import Mito from "../index";
import { params } from "../params";
import CellBar from "./CellBar";
import { TIME_PER_YEAR, Season } from "../game";
import styled from "styled-components";

const Positioner = styled.div`
  position: absolute;
  top: 0;
  left: 33%;
  right: 33%;
`;

const Container = styled.div`
  display: flex;
  position: relative;
`;

const EndBrace = styled.div`
  width: 5px;
  height: 40px;
  background: darkgray;
`;

const Bar = styled.div`
  height: 20px;
  align-self: center;
  flex-grow: 1;
  border-top: 5px solid darkgray;
  border-bottom: 5px solid darkgray;
`;

const BarMarker = styled.div<{percent: number}>`
  position: absolute;
  top: 50%;
  transform: translate(0, -50%);
  height: 20px;
  width: 5px;
  background: lightgray;
  left: ${props => (props.percent * 100).toFixed(2)}%;
`;

const SeasonBead = styled.div<{percent: number}>`
  position: absolute;
  height: 30px;
  width: 10px;
  top: 50%;
  left: ${props => (props.percent * 100).toFixed(2)}%;
  transform: translate(-50%, -50%);
  background: white;
  border: 1px solid darkgrey;
`;

const SeasonText = styled.div`
`;

function capitalize(s: String) {
  return s.substr(0, 1).toLocaleUpperCase() + s.substr(1);
}

function SeasonsTracker({ time, season }: { time: number, season: Season }) {
  const yearDonePercent = time / TIME_PER_YEAR;
  const month = Math.floor(season.percent * 3) + 1;
  return (
    <Positioner>
      <Container>
        <EndBrace />
        <Bar>
          <BarMarker percent={0.25} />
          <BarMarker percent={0.5} />
          <BarMarker percent={0.75} />
          <SeasonBead percent={yearDonePercent} />
        </Bar>
        <EndBrace />
      </Container>
      <SeasonText>{capitalize(season.name)}, Month {month}</SeasonText>
    </Positioner>
  );
}

export interface HUDProps {
  mito: Mito;
}
export class HUD extends React.Component<HUDProps> {
  get mito() { return this.props.mito; }

  get world() { return this.mito.world; }

  get player() { return this.world.player; }

  get inventory() { return this.player.inventory; }

  private isTutorialFinished() {
    return this.mito.tutorialRef == null ? true : this.mito.tutorialRef.isFinished();
  }

  public render() {
    const isMaxed = this.inventory.isMaxed();
    const isMaxedEl = <div className={`mito-inventory-maxed${isMaxed ? " is-maxed" : ""}`}>maxed</div>;
    return (<>
      <div className={classnames("mito-hud", { hidden: !this.isTutorialFinished() })}>
        {this.renderFruitUI()}
      </div>
      <SeasonsTracker time={this.world.time} season={this.world.season} />
      <div className={classnames("mito-inventory", { hidden: false })}>
        {isMaxedEl}
        <div className="mito-inventory-container">
          {this.renderInventoryBar()}
          {this.renderInventory()}
        </div>
        <CellBar bar={this.mito.cellBar} index={this.mito.cellBarIndex} onIndexClicked={(i) => this.mito.setCellBarIndex(i)} />
      </div>
    </>);
  }

  renderInventory() {
    return (<div className="mito-inventory-indicator">
      <span className="mito-inventory-water">
        {this.inventory.water.toFixed(2)} water
                    </span>&nbsp;<span className="mito-inventory-sugar">
        {this.inventory.sugar.toFixed(2)} sugar
                    </span>
    </div>);
  }

  renderInventoryBar() {
    const waterPercent = this.inventory.water / params.maxResources;
    const sugarPercent = this.inventory.sugar / params.maxResources;
    const emptyPercent = 1 - (this.inventory.water + this.inventory.sugar) / params.maxResources;
    const waterStyles: React.CSSProperties = { width: `${(waterPercent * 100)}%` };
    const sugarStyles: React.CSSProperties = { width: `${(sugarPercent * 100)}%` };
    const emptyStyles: React.CSSProperties = { width: `${(emptyPercent * 100)}%` };
    const inventoryBar = (<div className="mito-inventory-bar">
      <div style={waterStyles} className="mito-inventory-bar-water"></div>
      <div style={sugarStyles} className="mito-inventory-bar-sugar"></div>
      <div style={emptyStyles} className="mito-inventory-bar-empty"></div>
    </div>);
    return inventoryBar;
  }

  // public renderTime() {
  //     return <div className="mito-hud-section">{this.props.world.time}</div>;
  // }
  public renderFruitUI() {
    const { world } = this;
    if (world.fruit != null) {
      return (<div className="mito-hud-section">
        You bear Fruit! {world.fruit.inventory.sugar.toFixed(2)} of {Fruit.sugarToWin} sugar!
                </div>);
    }
  }
}
