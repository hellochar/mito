import * as React from "react";

import Mito from "../index";
import { Instructions } from "./Instructions";

export interface GameStackProps {
  mito: Mito;
}
export class GameStack extends React.PureComponent<GameStackProps> {
  handlePlay = () => {
    this.props.mito.instructionsOpen = false;
  };
  public render() {
    if (this.props.mito.instructionsOpen) {
      return <Instructions play={this.handlePlay} />;
    } else {
      return null;
    }
  }
}
