import classNames from "classnames";
import * as React from "react";
import "./HotkeyButton.scss";

interface HotkeyButtonProps extends React.HTMLProps<HTMLDivElement> {
  hotkey: string;
}

export function HotkeyButton({ hotkey, className, onClick, ...restProps }: HotkeyButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick && onClick(e);
    ensureCanvasFocus(e);
  };
  return (
    <div className={classNames("hotkey-button", className)} onClick={handleClick} {...restProps}>
      <span className="hotkey">{hotkey}</span>
    </div>
  );
}

function ensureCanvasFocus(e: React.SyntheticEvent<any>) {
  e.preventDefault();
  const canvas = document.getElementsByTagName("canvas")[0];
  canvas.focus();
}
