import classnames from "classnames";
import { params } from "game/params";
import { Howler } from "howler";
import * as React from "react";
import { FaVolumeOff, FaVolumeUp } from "react-icons/fa";
import Ticker from "std/ticker";
import * as THREE from "three";
import Mito from "../../mito/mito";
import { ISketch, SketchAudioContext, UI_EVENTS } from "./sketch";
import "./SketchComponent.scss";

export interface ISketchComponentProps extends React.DOMAttributes<HTMLDivElement> {
  eventsOnBody?: boolean;
  errorElement?: JSX.Element;
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

interface SketchSuccessComponentState {
  frameCount: number;
  volumeEnabled: boolean;
}

class SketchSuccessComponent extends React.PureComponent<SketchSuccessComponentProps, SketchSuccessComponentState> {
  private frameId?: number;

  private lastTimestamp = 0;

  private stop = false;

  constructor(props: SketchSuccessComponentProps) {
    super(props);
    this.state = {
      frameCount: props.sketch.frameCount,
      volumeEnabled: JSON.parse(window.localStorage.getItem("sketch-volumeEnabled") || "true"),
    };
  }

  public shouldPlayAudio() {
    return this.state.volumeEnabled && document.visibilityState === "visible" && document.hasFocus();
  }

  public syncAudioContext() {
    const { audioContext } = this.props.sketch;
    if (audioContext != null) {
      // this.userVolume.gain.value = this.state.volumeEnabled ? 1 : 0;
      if (this.shouldPlayAudio() && audioContext.state === "suspended") {
        audioContext.resume();
      } else if (!this.shouldPlayAudio() && audioContext.state === "running") {
        audioContext.suspend();
      }
    }
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleWindowResize);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
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

    this.frameId = Ticker.addAnimation(this.loop);
  }

  render() {
    const sketchElementsWithKey: React.ReactNode[] = [];
    if (this.props.sketch.render != null) {
      sketchElementsWithKey.push(this.props.sketch.render());
    }
    if (this.props.sketch.elements != null) {
      sketchElementsWithKey.push(...this.props.sketch.elements);
    }
    return (
      <div className="sketch-elements">
        {/* {sketchElementsWithKey} */}
        {sketchElementsWithKey.map((el, idx) => {
          if (React.isValidElement(el)) {
            return React.cloneElement(el, { key: idx });
          } else {
            return el;
          }
        })}
        {this.renderVolumeButton()}
      </div>
    );
  }

  private renderVolumeButton() {
    if (params.hud) {
      const { volumeEnabled } = this.state;
      return (
        <button className="user-volume" onClick={this.handleVolumeButtonClick}>
          {volumeEnabled ? <FaVolumeUp /> : <FaVolumeOff />}
        </button>
      );
    }
  }

  private handleVolumeButtonClick = () => {
    const volumeEnabled = !this.state.volumeEnabled;
    this.setState({ volumeEnabled });
    window.localStorage.setItem("sketch-volumeEnabled", JSON.stringify(volumeEnabled));
  };

  componentWillUnmount() {
    this.stop = true;

    if (this.props.sketch.destroy) {
      this.props.sketch.destroy();
    }
    if (this.frameId != null) {
      Ticker.removeAnimation(this.frameId);
    }
    this.props.sketch.renderer.dispose();
    window.removeEventListener("resize", this.handleWindowResize);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

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
    this.syncAudioContext();
    try {
      this.props.sketch.animate(millisElapsed);
    } catch (e) {
      console.error(e);
    }

    // careful - sketch.animate() might have triggered a whole React update loop
    // and made this component unmount.
    if (!this.stop) {
      // force new render()
      this.setState({
        frameCount: this.props.sketch.frameCount,
      });
    } else {
      Ticker.removeAnimation(this.frameId!);
    }
  };

  private handleWindowResize = () => {
    const { renderer } = this.props.sketch;
    this.updateRendererCanvasToMatchParent(renderer);
    if (this.props.sketch.resize != null) {
      this.props.sketch.resize(renderer.domElement.width, renderer.domElement.height);
    }
  };

  private handleVisibilityChange = () => {
    this.syncAudioContext();
  };

  private updateRendererCanvasToMatchParent(renderer: THREE.WebGLRenderer) {
    const parent = renderer.domElement.parentElement;
    if (parent != null) {
      renderer.setSize(parent.clientWidth, parent.clientHeight);
    }
  }
}

export interface ISketchComponentState {
  status: SketchStatus;
}

export class SketchComponent extends React.PureComponent<ISketchComponentProps, ISketchComponentState> {
  public state: ISketchComponentState = {
    status: { type: "loading" },
  };

  // private renderer?: THREE.WebGLRenderer;
  private audioContext?: SketchAudioContext;

  private userVolume?: GainNode;

  private handleContainerRef = (ref: HTMLDivElement | null) => {
    if (ref != null) {
      try {
        // create dependencies, setup sketch, and move to success state
        // we are responsible for live-updating the global user volume.
        // const AudioContextConstructor: typeof AudioContext =
        //   (window as any).AudioContext || (window as any).webkitAudioContext;
        // const audioContext = (this.audioContext = new AudioContextConstructor() as SketchAudioContext);
        const audioContext = (this.audioContext = Howler.ctx as SketchAudioContext);
        (THREE.AudioContext as any).setContext(audioContext);
        this.userVolume = audioContext.createGain();
        this.userVolume.gain.setValueAtTime(0.8, 0);
        this.userVolume.connect(Howler.masterGain);
        const audioContextGain = (audioContext.gain = audioContext.createGain());
        audioContextGain.connect(this.userVolume);

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          preserveDrawingBuffer: true,
          antialias: true,
        });
        renderer.debug.checkShaderErrors = true;
        ref.appendChild(renderer.domElement);

        const [attempt, onWinLoss] = this.props.otherArgs || [];
        const sketch = new Mito(renderer, this.audioContext, attempt as any, onWinLoss as any);
        this.setState({ status: { type: "success", sketch: sketch } });
      } catch (e) {
        this.setState({ status: { type: "error", error: e } });
        console.error(e);
      }
    } else {
      if (this.state.status.type === "success") {
        this.state.status.sketch.canvas.remove();
      }
      this.userVolume?.disconnect();
      this.setState({ status: { type: "loading" } });
    }
  };

  public render() {
    const { otherArgs, eventsOnBody, errorElement, ...containerProps } = this.props;
    const className = classnames("sketch-component", this.state.status.type);
    return (
      <div {...containerProps} className={className} ref={this.handleContainerRef}>
        {this.renderSketchOrStatus()}
      </div>
    );
  }

  private renderSketchOrStatus() {
    const { status } = this.state;
    if (status.type === "success") {
      // key on id to not destroy and re-create the component somehow
      return <SketchSuccessComponent sketch={status.sketch} eventsOnBody={this.props.eventsOnBody} />;
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
}
