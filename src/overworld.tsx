import React from "react";

import { World } from "./sketches/mito/game";
import { Environment, Temperate, Rocky, Desert } from "./sketches/mito/game/environment";

import "./overworld.scss";

export interface OverWorld {
    width: number;
    height: number;
    levels: {
        [key: string]: Level;
    }
}

export interface Level {
    x: number;
    y: number;
    conquered: boolean;
    visible: boolean;
    environment: Environment;
    world?: World;
}

export function createLevel(x: number, y: number, environment: Environment): Level {
    return {
        x,
        y,
        conquered: false,
        visible: false,
        environment,
        world: new World(environment),
    };
}

export function generateNewOverWorld(): OverWorld {
    const levels: { [key: string]: Level } = {};
    const width = 5;
    const height = 5;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const key = `${x},${y}`;
            if (x === Math.floor(width / 2) && y === Math.floor(height / 2)) {
                const environment = Temperate();
                const level = createLevel(x, y, environment);
                level.visible = true;
                levels[key] = level;
            } else {
                const environment = Math.random() < 0.33 ? Temperate() : Math.random() < 0.5 ? Rocky() : Desert();
                levels[key] = createLevel(x, y, environment);
            }
        }
    }
    return { width, height, levels };
}

interface OverWorldMapProps {
    overWorld: OverWorld;
    onClickLevel: (level: Level) => void;
}

interface OverWorldMapState {
}

export class OverWorldMap extends React.PureComponent<OverWorldMapProps, OverWorldMapState> {
    render() {
        const overWorldElements = [];
        for (const key in this.props.overWorld.levels) {
            const level = this.props.overWorld.levels[key];
            // if (level.visible) {
                overWorldElements.push(this.renderLevelMapIcon(level));
            // }
        }
        const style = {
            width: this.props.overWorld.width * 100,
            height: this.props.overWorld.width * 100,
        };

        return (
            <div className="overworld-map-container">
                <h1>Overworld Map</h1>
                <div className="overworld-map" style={style}>
                    {overWorldElements}
                </div>
            </div>
        );
    }

    handleOnClick = (level: Level) => {
        this.props.onClickLevel(level);
    }

    renderLevelMapIcon(level: Level) {
        const icon = (() => {
            switch (level.environment) {
                case Temperate(): return this.renderTemperate();
                case Rocky(): return this.renderRocky();
                case Desert(): return this.renderDesert();
            }
        })();
        const style = {
            transform: `translate(${level.x * 100}px, ${level.y * 100}px)`,
        };
        return (
            <div className="overworld-map-icon" style={style} onClick={() => this.handleOnClick(level)}>
                {icon}
            </div>
        )
    }

    renderTemperate() {
        return <div className="icon icon-temperate">Temperate</div>;
    }

    renderRocky() {
        return <div className="icon icon-rocky">Rocky</div>;
    }

    renderDesert() {
        return <div className="icon icon-desert">Desert</div>;
    }
}
