import * as React from "react";
import { Action } from "../../core/player/action";
import Mito from "../../sketches/mito";

export interface TutorialProps {
  time: number;
  mito: Mito;
  scene: THREE.Scene;
  onFulfilled: () => void;
}

export abstract class Tutorial<P = {}, S = {}> extends React.PureComponent<P & TutorialProps, S> {
  componentDidUpdate() {
    if (this.isFulfilled()) {
      this.props.onFulfilled();
    }
  }

  abstract onActionPerformed(action: Action): void;

  abstract isFulfilled(): boolean;
}
