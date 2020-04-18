import { Overlay, Tab, Tabs } from "@blueprintjs/core";
import { getDecidedGameResult } from "game/gameResult";
import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { GoGear } from "react-icons/go";
import "./GameMenu.scss";
import { HUDProps, useHotkey } from "./HUD";

export const GameMenu: React.FC<HUDProps> = ({ mito }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const handleOverlayClose = React.useCallback(() => {
    setIsOpen(false);
  }, []);
  const handleGameMenuToggleClick = React.useCallback(() => {
    setIsOpen(true);
  }, []);
  const toggleMenu = React.useCallback(() => setIsOpen((open) => !open), []);
  const handleAbandonPlant = React.useCallback(() => {
    mito.onWinLoss(getDecidedGameResult(mito));
  }, [mito]);
  useHotkey("Escape", toggleMenu);

  const menuPanel = (
    <div>
      <div className="option abandon" onClick={handleAbandonPlant}>
        Abandon Plant
      </div>
    </div>
  );
  if (mito.isFirstPlaythrough) {
    return null;
  }
  return (
    <>
      <button className="game-menu-toggle game-options-button" onClick={handleGameMenuToggleClick}>
        <GoGear />
      </button>
      <Overlay
        isOpen={isOpen}
        onClose={handleOverlayClose}
        canEscapeKeyClose={false}
        canOutsideClickClose={false}
        className="bp3-dark"
        backdropClassName="game-menu-backdrop"
      >
        <div className="game-menu">
          <Tabs defaultSelectedTabId="menu">
            <div className="esc" onClick={handleOverlayClose}>
              <FaArrowLeft />
            </div>
            <Tab id="menu" title="Menu" panel={menuPanel} />
            {/* <Tab id="attr" title="Attribution" panel={<Attribution />} /> */}
          </Tabs>
        </div>
      </Overlay>
    </>
  );
};

const Attribution = () => {
  return (
    <div className="attribution">
      <p>
        In-game Tileset:{" "}
        <a href="http://kenney.nl/assets?s=roguelike" target="_blank" rel="noopener noreferrer">
          Kenney.nl Roguelike Assets
        </a>
      </p>
      <p>
        Photosynthesis pop sound:{" "}
        <a href="http://soundbible.com/2067-Blop.html" target="_blank" rel="noopener noreferrer">
          Blop by Mark DiAngelo
        </a>{" "}
        (<a href="https://creativecommons.org/licenses/by/3.0/us/">CC BY 3.0 US</a>)
      </p>
      <p>
        Fruit icon:{" "}
        <a href="https://www.freepik.com/free-vector/fruits-set-pixel-icons_1001072.htm">Designed by Freepik</a>
      </p>
      <p>
        Part of 7drl 2018:{" "}
        <a href="http://7drl.org/" target="_blank" rel="noopener noreferrer">
          http://7drl.org/
        </a>
      </p>
    </div>
  );
};
