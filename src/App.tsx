import React from 'react';

import { FullPageSketch } from './fullPageSketch';
import Mito from './sketches/mito';
import { OverWorldMap } from './overworld/OverWorldMap';
import { OverWorld } from "./overworld/overWorld";
import { HexTile } from './overworld/hexTile';

export interface AppState {
    overWorld: OverWorld;
    currentLevel?: HexTile;
}

class App extends React.PureComponent<{}, AppState> {
    state: AppState = {
        overWorld: OverWorld.generate(),
    };
    handleClickLevel = (level: HexTile) => {
        if (level.info.visible && !level.info.conquered) {
            this.setState({ currentLevel: level });
        }
    }

    handleWinLoss = (state: "win" | "lose") => {
        if (state === "win" && this.state.currentLevel) {
            const { currentLevel } = this.state;
            currentLevel.info.conquered = true;

            for (const n of currentLevel.neighbors) {
                n.info.visible = true;
            }
            this.setState({
                currentLevel: undefined
            });
        }
    }

    render() {
        return (
            <div className="App">
                {this.maybeRenderOverWorldMap()}
                {this.maybeRenderLevel()}
            </div>
        );
    }

    maybeRenderOverWorldMap() {
        if (this.state.currentLevel == null) {
            return <OverWorldMap overWorld={this.state.overWorld} onClickLevel={this.handleClickLevel} />;
        }
    }

    maybeRenderLevel() {
        if (this.state.currentLevel != null) {
            return <FullPageSketch sketchClass={Mito} otherArgs={[this.state.currentLevel, this.handleWinLoss]} />;
        }
    }
}

export default App;
