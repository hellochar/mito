import * as THREE from "three";

import devlog from "../../common/devlog";
import { SketchAudioContext } from "../../sketch";

function sourceElement(assetName: string, type: string) {
  const source = document.createElement("source");
  source.src = `/assets/audio/${assetName}.${type}`;
  source.type = `audio/${type}`;
  return source;
}
function makeNodeOfAudioAsset(ctx: SketchAudioContext, assetName: string): Unit {
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.loop = true;
  audio.appendChild(sourceElement(assetName, "ogg"));
  audio.appendChild(sourceElement(assetName, "mp3"));
  audio.appendChild(sourceElement(assetName, "wav"));
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

export let blopBuffer: THREE.AudioBuffer;
export let suckWaterBuffer: THREE.AudioBuffer;

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
  mito = makeNodeOfAudioAsset(ctx, "mito-base");
  mito.audio.oncanplaythrough = oneMoreLoaded;
  mito.gain.gain.value = 0.5;

  strings = makeNodeOfAudioAsset(ctx, "mito-strings");
  strings.audio.oncanplaythrough = oneMoreLoaded;
  strings.gain.gain.value = 0.0;

  drums = makeNodeOfAudioAsset(ctx, "mito-drums");
  drums.audio.oncanplaythrough = oneMoreLoaded;
  drums.gain.gain.value = 0.0;

  footsteps = makeNodeOfAudioAsset(ctx, "footsteps");
  footsteps.gain.gain.value = 0;
  footsteps.gain.connect(ctx.gain);

  build = makeNodeOfAudioAsset(ctx, "build");
  build.gain.gain.value = 0;
  build.gain.connect(ctx.gain);

  const loader = new THREE.AudioLoader();

  loader.load(
    'assets/audio/Blop-Mark_DiAngelo-79054334.mp3',
    (audioBuffer: THREE.AudioBuffer) => {
      blopBuffer = audioBuffer;
    },
    (xhr: ProgressEvent) => {
      // devlog((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (err: any) => {
      devlog('An error happened');
    },
  );
  loader.load(
    'assets/audio/suckwater.wav',
    (audioBuffer: THREE.AudioBuffer) => {
      suckWaterBuffer = audioBuffer;
    },
    (xhr: ProgressEvent) => {
      // devlog((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (err: any) => {
      devlog('An error happened');
    },
  );
}
