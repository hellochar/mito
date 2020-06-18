import classNames from "classnames";
import { sleep } from "common/promise";
import React, { useEffect } from "react";
import Mito from "../../../mito/mito";
import { HotkeyButton } from "../HotkeyButton";
import "./InteractToolSwitcher.scss";
import { InteractToolItem } from "./ToolBarUI";

export const InteractToolSwitcher: React.FC<{
  mito: Mito;
}> = ({ mito }) => {
  useEffect(() => {
    sleep(500).then(() => {
      mito.showInteractToolSwitcher = false;
    });
  }, [mito.showInteractToolSwitcher]);
  const interactTool = mito.toolBar.interactTool;
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.repeat && event.code === "KeyQ") {
        // switch the tool
        interactTool.isTakeAll = true;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [interactTool.isTakeAll]);
  return (
    <div className={classNames("interact-tool-switcher", { "take-all": interactTool.isTakeAll })}>
      <div className="item">
        <HotkeyButton hotkey="Q" />
        <InteractToolItem isTakeAll={false} />
      </div>
      <div className="item">
        <HotkeyButton hotkey="QQ" />
        <InteractToolItem isTakeAll={true} />
      </div>
    </div>
  );
};
