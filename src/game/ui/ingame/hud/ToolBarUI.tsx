import classNames from "classnames";
import Keyboard from "game/input/keyboard";
import { spritesheetLoaded } from "game/spritesheet";
import IconCell, { ActionBarItem } from "game/ui/common/IconCell";
import * as React from "react";
import { Vector2 } from "three";
import { Tool, ToolBar, ToolBuild } from "../../../input/toolBar";
import { HotkeyButton } from "../HotkeyButton";
import "./ToolBarUI.scss";

export const ToolBarUI: React.FC<{ bar: ToolBar }> = ({ bar }) => {
  const keys = Object.keys(bar.tools);
  return (
    <div className="tool-bar">
      <div className="tool-bar-items">
        {keys.map((code) => {
          return (
            <ToolBarItem key={code} bar={bar} code={code} selected={bar.currentKey === code} tool={bar.tools[code]} />
          );
        })}
      </div>
    </div>
  );
};

const ToolBarItem: React.FC<{ bar: ToolBar; code: string; selected: boolean; tool: Tool }> = ({
  bar,
  code,
  selected,
  tool,
}) => {
  const onClick = React.useCallback(() => {
    bar.setKey(code);
  }, [bar, code]);

  const hotkey = code.charAt(code.length - 1);
  const itemIcon =
    tool.type === "interact" ? (
      <>
        <InteractToolItem onClick={onClick} isTakeAll={tool.isTakeAll} />
        <HotkeyButton hotkey={hotkey} onClick={onClick} />
      </>
    ) : (
      <>
        <ToolBuildIcon onClick={onClick} tool={tool} spritesheetLoaded={spritesheetLoaded} />
        <HotkeyButton hotkey={hotkey} onClick={onClick} />
      </>
    );

  return <div className={classNames("tool-bar-item", { selected })}>{itemIcon}</div>;
};

export const InteractToolItem: React.FC<{ onClick?: () => void; isTakeAll: boolean }> = ({ onClick, isTakeAll }) => (
  <ActionBarItem onClick={onClick} className={classNames("interact-tool-icon", { "take-all": isTakeAll })}>
    {isTakeAll ? "Take All" : "Interact"}
  </ActionBarItem>
);

export interface CellBarItemProps {
  onClick: () => void;
  spritesheetLoaded: boolean;
  tool: ToolBuild;
}

const ToolBuildIcon: React.FC<CellBarItemProps> = ({ onClick, spritesheetLoaded, tool }) => {
  const argsChildren: JSX.Element[] = [];
  const type = tool.cellType;
  if (type.args && type.args.direction) {
    argsChildren.push(<TransportDirArrow key={argsChildren.length} dir={type.args.direction} />);
  }
  return (
    <IconCell
      onClick={onClick}
      cellType={type}
      spritesheetLoaded={spritesheetLoaded}
      showCosts={Keyboard.keyMap.has("ShiftLeft")}
    >
      {type.name}
      {argsChildren}
    </IconCell>
  );
};

const TransportDirArrow: React.FC<{ dir: Vector2 }> = ({ dir }) => {
  return <div className="transport-dir-arrow" style={{ transform: `rotate(${dir.angle()}rad)` }}></div>;
};
