import React from 'react';

import { FullPageSketch } from './fullPageSketch';
import Mito from './sketches/mito';
import { OverWorld, OverWorldMap, Level } from './overworld';

export interface AppState {
    overWorld: OverWorld;
    currentLevel?: Level;
}

class App extends React.PureComponent<{}, AppState> {
    state: AppState = {
        overWorld: OverWorld.generate(),
    };
    handleClickLevel = (level: Level) => {
        this.setState({ currentLevel: level });
    }

    handleWinLoss = (state: "win" | "lose") => {
        if (state === "win" && this.state.currentLevel) {
            const { currentLevel } = this.state;
            const {x, y} = currentLevel;
            currentLevel.conquered = true;
            const { overWorld } = this.state;
            overWorld.levelAt(x-1, y).forEach((l) => l.visible = true);
            overWorld.levelAt(x+1, y).forEach((l) => l.visible = true);
            overWorld.levelAt(x, y-1).forEach((l) => l.visible = true);
            overWorld.levelAt(x, y+1).forEach((l) => l.visible = true);
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
