import blopSrc from "assets/audio/Blop-Mark_DiAngelo-79054334.mp3";
import buildSoundSrc from "assets/audio/build.wav";
import footstepsSrc from "assets/audio/footsteps.wav";
import mitoBaseSrc from "assets/audio/mito-base.mp3";
import mitoDrumsSrc from "assets/audio/mito-drums.mp3";
import mitoStringsSrc from "assets/audio/mito-strings.mp3";
import suckWaterSrc from "assets/audio/suckwater.wav";
import * as THREE from "three";
import devlog from "../../common/devlog";
import { SketchAudioContext } from "../sketch";

function sourceElement(src: string) {
  const type = src.substr(src.length - 3);
  const source = document.createElement("source");
  source.src = src;
  source.type = `audio/${type}`;
  return source;
}
function makeNodeOfAudioAsset(ctx: SketchAudioContext, ...srcs: string[]): Unit {
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.loop = true;
  for (const src of srcs) {
    audio.appendChild(sourceElement(src));
  }
  // audio.appendChild(sourceElement(assetName, "mp3"));
  // audio.appendChild(sourceElement(assetName, "wav"));
  const source = ctx.createMediaElementSource(audio);
  const gain = ctx.createGain();
  source.connect(gain);
  return { audio, gain };
}

interface Unit {
  gain: GainNode;
  audio: HTMLAudioElement;
}

export let mito: Unit;
export let strings: Unit;
export let drums: Unit;

export let footsteps: Unit;
export let build: Unit;

const loader = new THREE.AudioLoader();
function loadAudioPromise(src: string) {
  return new Promise<AudioBuffer>((resolve, reject) => {
    loader.load(
      src,
      (audioBuffer) => {
        resolve(audioBuffer);
      },
      (xhr: ProgressEvent) => {
        // devlog((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (err: any) => {
        devlog("An error happened");
        reject(err);
      }
    );
  });
}
export let blopBuffer = loadAudioPromise(blopSrc);
export let suckWaterBuffer = loadAudioPromise(suckWaterSrc);

export function hookUpAudio(ctx: SketchAudioContext) {
  let numDone = 0;
  function oneMoreLoaded() {
    numDone++;
    if (numDone === 3) {
      mito.audio.currentTime = 0;
      strings.audio.currentTime = 0;
      drums.audio.currentTime = 0;
      mito.gain.connect(ctx.gain);
      strings.gain.connect(ctx.gain);
      drums.gain.connect(ctx.gain);
    }
  }
  mito = makeNodeOfAudioAsset(ctx, mitoBaseSrc);
  mito.audio.oncanplaythrough = oneMoreLoaded;
  mito.gain.gain.value = 0.5;

  strings = makeNodeOfAudioAsset(ctx, mitoStringsSrc);
  strings.audio.oncanplaythrough = oneMoreLoaded;
  strings.gain.gain.value = 0.0;

  drums = makeNodeOfAudioAsset(ctx, mitoDrumsSrc);
  drums.audio.oncanplaythrough = oneMoreLoaded;
  drums.gain.gain.value = 0.0;

  footsteps = makeNodeOfAudioAsset(ctx, footstepsSrc);
  footsteps.gain.gain.value = 0;
  footsteps.gain.connect(ctx.gain);

  build = makeNodeOfAudioAsset(ctx, buildSoundSrc);
  build.gain.gain.value = 0;
  build.gain.connect(ctx.gain);
}
