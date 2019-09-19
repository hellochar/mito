import React from 'react';

import { FullPageSketch } from './fullPageSketch';
import Mito from './sketches/mito';
import { OverWorldMap } from './overworld/OverWorldMap';
import { OverWorld } from "./overworld/overWorld";
import { HexTile } from './overworld/hexTile';

export interface AppState {
    overWorld: OverWorld;
    activeLevel?: HexTile;
}

class App extends React.PureComponent<{}, AppState> {
    state: AppState = {
        // overWorld: OverWorld.generateFilledHex(),
        overWorld: OverWorld.generateRectangle(100, 50),
    };
    handlePlayLevel = (level: HexTile) => {
        console.log(level.info);
        if (level.info.visible && !level.info.conquered) {
            this.setState({ activeLevel: level });
        }
    }

    handleWinLoss = (state: "win" | "lose") => {
        if (state === "win" && this.state.activeLevel) {
            const { activeLevel: currentLevel } = this.state;
            currentLevel.info.conquered = true;

            for (const n of currentLevel.neighbors) {
                n.info.visible = true;
            }
            this.setState({
                activeLevel: undefined
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
        if (this.state.activeLevel == null) {
            return <OverWorldMap overWorld={this.state.overWorld} onPlayLevel={this.handlePlayLevel} />;
        }
    }

    maybeRenderLevel() {
        if (this.state.activeLevel != null) {
            return <FullPageSketch sketchClass={Mito} otherArgs={[this.state.activeLevel, this.handleWinLoss]} />;
        }
    }
}

export default App;
