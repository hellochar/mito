import { Player } from "core";
import { Cell } from "core/tile";
import { ResourceIcon } from "game/ui/common/ResourceIcon";
import React from "react";
import "./CellInspector.scss";

export const CellInspector: React.FC<{
  cell: Cell;
  player: Player;
}> = ({ cell, player }) => {
  return (
    <>
      <div className="cell-inspector left">
        {/* <div>
          <h3>{cell.displayName}</h3>
        </div> */}
        <div className="buttons">
          <div className="resources">
            <div className="resource-row">
              <button
                disabled={player.inventory.water === 0}
                onClickCapture={(e) => {
                  player.inventory.give(cell.inventory, 1, 0);
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Give&nbsp;
                <ResourceIcon name="water" />
              </button>
              <button
                disabled={cell.inventory.water === 0}
                onClickCapture={(e) => {
                  cell.inventory.give(player.inventory, 1, 0);
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Take&nbsp;
                <ResourceIcon name="water" />
              </button>
            </div>
            <div className="resource-row">
              <button
                disabled={player.inventory.sugar === 0}
                onClickCapture={(e) => {
                  player.inventory.give(cell.inventory, 0, 1);
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Give&nbsp;
                <ResourceIcon name="sugar" />
              </button>
              <button
                disabled={cell.inventory.sugar === 0}
                onClickCapture={(e) => {
                  cell.inventory.give(player.inventory, 0, 1);
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Take&nbsp;
                <ResourceIcon name="sugar" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="cell-inspector right">
        <button className="deconstruct" onClick={() => player.setAction({ type: "deconstruct", position: cell.pos })}>
          Deconstruct
        </button>
      </div>
    </>
  );
};
