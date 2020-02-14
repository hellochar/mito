export const Keyboard = new (class Input {
  readonly keyMap = new Set<string>();

  constructor() {
    window.addEventListener("blur", this.handleBlur);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private handleBlur = () => {
    this.keyMap.clear();
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    this.keyMap.add(event.code);
    const isOpeningDevtoolsOnChrome =
      (event.code === "KeyI" && event.shiftKey && event.ctrlKey) ||
      (event.code === "KeyI" && event.altKey && event.metaKey);
    if (!isOpeningDevtoolsOnChrome) {
      event.preventDefault();
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keyMap.delete(event.code);
  };

  public isAltHeld() {
    return (
      // TODO add mac cmd key
      this.keyMap.has("AltLeft") || this.keyMap.has("AltRight")
    );
  }
})();

export default Keyboard;
