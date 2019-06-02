import React from 'react';

import { FullPageSketch } from './fullPageSketch';
import Mito from './sketches/mito';
import { OverWorld, OverWorldMap, Level, generateNewOverWorld } from './overworld';

export interface AppState {
    overWorld: OverWorld;
    currentLevel?: Level;
}

class App extends React.PureComponent<{}, AppState> {
    state: AppState = {
        overWorld: generateNewOverWorld(),
    };
    handleClickLevel = (level: Level) => {
        this.setState({ currentLevel: level });
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
            return <FullPageSketch sketchClass={Mito} otherArgs={[this.state.currentLevel]} />;
        }
    }
}

export default App;
