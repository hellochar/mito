import classnames from "classnames";
import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext, SketchConstructor, UI_EVENTS } from "./sketch";

import { FaVolumeOff, FaVolumeUp } from "react-icons/fa";

export interface ISketchComponentProps extends React.DOMAttributes<HTMLDivElement> {
  eventsOnBody?: boolean;
  errorElement?: JSX.Element;
  sketchClass: SketchConstructor;
  otherArgs?: any[];
}

export interface SketchSuccess {
  type: "success";
  sketch: ISketch;
}

export interface SketchError {
  type: "error";
  error: Error;
}

export interface SketchLoading {
  type: "loading";
}

export type SketchStatus = SketchSuccess | SketchError | SketchLoading;

// Expects sketch to be setup but not init. SketchSuccessComponent is responsible for:
//      firing resize events
//      attaching ui event listeners
//      keeping focus on the canvas
interface SketchSuccessComponentProps {
  sketch: ISketch;
  eventsOnBody?: boolean;
}
class SketchSuccessComponent extends React.Component<SketchSuccessComponentProps, { frameCount: number }> {
  private frameId?: number;
  private lastTimestamp = 0;
  private stop = false;

  constructor(props: SketchSuccessComponentProps) {
    super(props);
    this.state = {
      frameCount: props.sketch.frameCount,
    }
  };

  componentDidMount() {
    window.addEventListener("resize", this.handleWindowResize);
    this.handleWindowResize();

    // canvas setup
    const canvas = this.props.sketch.renderer.domElement;
    canvas.tabIndex = 1;
    (Object.keys(UI_EVENTS) as Array<keyof typeof UI_EVENTS>).forEach((eventName) => {
      if (this.props.sketch.events != null) {
        const callback = this.props.sketch.events[eventName] as EventListener;
        if (callback != null) {
          if (this.props.eventsOnBody) {
            document.body.addEventListener(eventName, callback);
          } else {
            canvas.addEventListener(eventName, callback);
          }
        }
      }
    });
    // prevent scrolling the viewport
    // $canvas.on("touchmove", (event) => {
    //     event.preventDefault();
    // });

    this.frameId = requestAnimationFrame(this.loop);
  }

  render() {
    const sketchElementsWithKey: React.ReactElement[] = [];
    if (this.props.sketch.render != null) {
      sketchElementsWithKey.push(this.props.sketch.render());
    }
    if (this.props.sketch.elements != null) {
      sketchElementsWithKey.push(...this.props.sketch.elements);
    }
    return (
      <div className="sketch-elements">
        {sketchElementsWithKey.map((el, idx) => React.cloneElement(el, { key: idx }))}
      </div>
    );
  }

  componentWillUnmount() {
    this.stop = true;

    if (this.props.sketch.destroy) {
      this.props.sketch.destroy();
    }
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
    this.props.sketch.renderer.dispose();
    window.removeEventListener("resize", this.handleWindowResize);

    const canvas = this.props.sketch.canvas;
    (Object.keys(UI_EVENTS) as Array<keyof typeof UI_EVENTS>).forEach((eventName) => {
      if (this.props.sketch.events != null) {
        const callback = this.props.sketch.events[eventName] as EventListener;
        if (callback != null) {
          if (this.props.eventsOnBody) {
            document.body.removeEventListener(eventName, callback);
          } else {
            canvas.removeEventListener(eventName, callback);
          }
        }
      }
    });
  }

  private loop = (timestamp: number) => {
    const millisElapsed = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.props.sketch.frameCount++;
    this.props.sketch.timeElapsed = timestamp;
    try {
      this.props.sketch.animate(millisElapsed);
    } catch (e) {
      console.error(e);
    }

    // careful - sketch.animate might have triggered a whole React update loop
    // and made this component unmount.
    if (!this.stop) {
      // force new render()
      this.setState({
        frameCount: this.props.sketch.frameCount,
      });
      this.frameId = requestAnimationFrame(this.loop);
    }
  }

  private handleWindowResize = () => {
    const { renderer } = this.props.sketch;
    this.updateRendererCanvasToMatchParent(renderer);
    if (this.props.sketch.resize != null) {
      this.props.sketch.resize(renderer.domElement.width, renderer.domElement.height);
    }
  }

  private updateRendererCanvasToMatchParent(renderer: THREE.WebGLRenderer) {
    const parent = renderer.domElement.parentElement;
    if (parent != null) {
      renderer.setSize(parent.clientWidth, parent.clientHeight);
    }
  }
}

export interface ISketchComponentState {
  status: SketchStatus;
  volumeEnabled: boolean;
}

export class SketchComponent extends React.Component<ISketchComponentProps, ISketchComponentState> {
  public state: ISketchComponentState = {
    status: { type: "loading" },
    volumeEnabled: JSON.parse(window.localStorage.getItem("sketch-volumeEnabled") || "true"),
  };

  // private renderer?: THREE.WebGLRenderer;
  private audioContext?: SketchAudioContext;
  private userVolume?: GainNode;

  private handleContainerRef = (ref: HTMLDivElement | null) => {
    if (ref != null) {
      try {
        // create dependencies, setup sketch, and move to success state
        // we are responsible for live-updating the global user volume.
        const AudioContextConstructor: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioContext = this.audioContext = new AudioContextConstructor() as SketchAudioContext;
        (THREE.AudioContext as any).setContext(audioContext);
        this.userVolume = audioContext.createGain();
        this.userVolume.gain.setValueAtTime(0.8, 0);
        this.userVolume.connect(audioContext.destination);
        const audioContextGain = audioContext.gain = audioContext.createGain();
        audioContextGain.connect(this.userVolume);
        document.addEventListener("visibilitychange", this.handleVisibilityChange);

        const renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true, antialias: true });
        ref.appendChild(renderer.domElement);

        const otherArgs = this.props.otherArgs || [];
        const sketch = new (this.props.sketchClass)(renderer, this.audioContext, ...otherArgs);
        this.setState({ status: { type: "success", sketch: sketch } });
      } catch (e) {
        this.setState({ status: { type: "error", error: e } });
        console.error(e);
      }
    } else {
      if (this.state.status.type === "success") {
        this.state.status.sketch.canvas.remove();
      }
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      if (this.audioContext != null) {
        this.audioContext.close();
      }
      this.setState({ status: { type: "loading" } });
    }
  }

  public render() {
    if (this.userVolume != null && this.audioContext != null) {
      // this.userVolume.gain.value = this.state.volumeEnabled ? 1 : 0;
      if (this.state.volumeEnabled && this.audioContext.state === "suspended") {
        this.audioContext.resume();
      } else if (!this.state.volumeEnabled && this.audioContext.state === "running") {
        this.audioContext.suspend();
      }
    }

    const { sketchClass, otherArgs, eventsOnBody, errorElement, ...containerProps } = this.props;
    const className = classnames("sketch-component", this.state.status.type);
    return (
      <div {...containerProps} id={this.props.sketchClass.id} className={className} ref={this.handleContainerRef}>
        {this.renderSketchOrStatus()}
        {this.renderVolumeButton()}
      </div>
    );
  }

  private renderSketchOrStatus() {
    const { status } = this.state;
    if (status.type === "success") {
      // key on id to not destroy and re-create the component somehow
      return <SketchSuccessComponent key={this.props.sketchClass.id} sketch={status.sketch} eventsOnBody={this.props.eventsOnBody} />;
    } else if (status.type === "error") {
      const errorElement = this.props.errorElement || this.renderDefaultErrorElement(status.error.message);
      return errorElement;
    } else if (status.type === "loading") {
      return null;
    }
  }

  private renderDefaultErrorElement(message: string) {
    return (
      <p className="sketch-error">
        Oops - something went wrong! Make sure you're using Chrome, or are on your desktop.
                <pre>{message}</pre>
      </p>
    );
  }

  private renderVolumeButton() {
    const { volumeEnabled } = this.state;
    return (
      <button className="user-volume" onClick={this.handleVolumeButtonClick}>
        {volumeEnabled ? <FaVolumeUp /> : <FaVolumeOff />}
      </button>
    );
  }

  private handleVolumeButtonClick = () => {
    const volumeEnabled = !this.state.volumeEnabled;
    this.setState({ volumeEnabled });
    window.localStorage.setItem("sketch-volumeEnabled", JSON.stringify(volumeEnabled));
  }

  private handleVisibilityChange = () => {
    if (this.audioContext != null) {
      if (document.hidden) {
        this.audioContext.suspend();
      } else if (this.state.volumeEnabled) {
        this.audioContext.resume();
      }
    }
  }
}
