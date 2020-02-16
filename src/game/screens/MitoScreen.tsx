import { SketchComponent } from "game/screens/sketch/SketchComponent";
import * as React from "react";
import "./MitoScreen.scss";

export interface ISketchRouteProps {
  otherArgs?: any[];
}

export default class MitoScreen extends React.PureComponent<ISketchRouteProps, {}> {
  public render() {
    return (
      <div className="full-page-sketch" ref={this.handleDivRef}>
        <SketchComponent otherArgs={this.props.otherArgs} />
      </div>
    );
  }

  private handleDivRef = (div: HTMLDivElement | null) => {
    if (div != null) {
      // this.requestFullscreen(div);
    } else {
      this.exitFullscreen();
    }
  };

  private exitFullscreen() {
    if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
  }
}
