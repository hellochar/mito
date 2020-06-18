import React from "react";

export function useHotkey(key: string, action: (event: KeyboardEvent) => void) {
  React.useEffect(() => {
    const cb = (event: KeyboardEvent) => {
      if (key === event.code) {
        action(event);
      }
    };
    window.addEventListener("keyup", cb);
    return () => {
      window.removeEventListener("keyup", cb);
    };
  }, [action, key]);
}
