import { PopulationAttempt } from "game/app";
import { GameResult } from "game/gameResult";
import { SketchComponent } from "game/screens/sketch/SketchComponent";
import * as React from "react";
import "./MitoScreen.scss";

export interface IMitoInstanceProps {
  attempt: PopulationAttempt;
  onWinLoss: (result: GameResult) => void;
}

export default class MitoScreen extends React.PureComponent<IMitoInstanceProps, {}> {
  public render() {
    return (
      <div className="full-page-sketch" ref={this.handleDivRef}>
        <SketchComponent {...this.props} />
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
