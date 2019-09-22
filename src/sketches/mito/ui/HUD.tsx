import classnames from "classnames";
import * as React from "react";

import { Fruit } from "../game/tile";
import Mito from "../index";
import { params } from "../params";
import CellBar from "./CellBar";

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
