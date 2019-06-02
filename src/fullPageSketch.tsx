import * as React from "react";

import { SketchConstructor } from "./sketch";
import { SketchComponent } from "./sketchComponent";

export interface ISketchRouteProps {
    sketchClass: SketchConstructor;
    otherArgs?: any[];
}

export class FullPageSketch extends React.Component<ISketchRouteProps, {}> {
    public render() {
        return (
            <div className="full-page-sketch" ref={this.handleDivRef}>
                <SketchComponent sketchClass={this.props.sketchClass} otherArgs={this.props.otherArgs} />
            </div>
        );
    }
    private handleDivRef = (div: HTMLDivElement | null) => {
        if (div != null) {
            // this.requestFullscreen(div);
        } else {
            this.exitFullscreen();
        }
    }

    private exitFullscreen() {
        if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
    }
}
