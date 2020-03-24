import { Vector2 } from "three";

export class Mouse {
  public readonly position = new Vector2();

  public isPressed = false;

  public button = -1;

  constructor(el: HTMLElement) {
    el.addEventListener("contextmenu", this.handleContextMenu);

    el.addEventListener("mousedown", this.handleMouseDown);
    el.addEventListener("mousemove", this.handleMouseMove);
    el.addEventListener("mouseup", this.handleMouseUp);
  }

  private handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    return false;
  };

  private handleMouseDown = (event: MouseEvent) => {
    this.isPressed = true;
    this.button = event.button;
    this.handleMouseMove(event);
  };

  private handleMouseMove = (event: MouseEvent) => {
    this.position.x = event.clientX!;
    this.position.y = event.clientY!;
  };

  private handleMouseUp = (event: MouseEvent) => {
    this.isPressed = false;
    this.button = -1;
    this.handleMouseMove(event);
  };
}
