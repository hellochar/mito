import classnames from "classnames";
import { parse } from "query-string";
import * as React from "react";

import { ISketch, SketchAudioContext, SketchConstructor } from "./sketch";
import { SketchComponent } from "./sketchComponent";

export interface ISketchRouteProps {
    sketchClass: SketchConstructor;

    isKiosk?: boolean;
}

export class FullPageSketch extends React.Component<ISketchRouteProps, {}> {
    public render() {
        const { isKiosk } = this.props;
        const isPresentationMode = !!parse(window.location.search).presentationMode;
        const classes = classnames("full-page-sketch", { "presentation-mode": isPresentationMode, "kiosk-mode": isKiosk });
        return (
            <div className={classes} ref={this.handleDivRef}>
                <SketchComponent sketchClass={this.props.sketchClass} />
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

    private requestFullscreen(ref: HTMLElement) {
        if (ref.webkitRequestFullscreen) {
            ref.webkitRequestFullscreen();
        } else if (ref.mozRequestFullScreen) {
            ref.mozRequestFullScreen();
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
