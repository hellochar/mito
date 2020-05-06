import blopSrc from "assets/audio/Blop-Mark_DiAngelo-79054334.mp3";
import buildSoundSrc from "assets/audio/build.mp3";
import buildCompleteSrc from "assets/audio/build_complete.mp3";
import deconstructSoundSrc from "assets/audio/deconstruct.mp3";
import dropWaterSrc from "assets/audio/drop_water.mp3";
import eatingSoundSrc from "assets/audio/eating.mp3";
import footstepsSrc from "assets/audio/footsteps.wav";
import fruitPoofSrc from "assets/audio/fruit-popOpen.mp3";
import impactSoftMedium003Src from "assets/audio/impactSoft_medium_003.mp3";
import interactSoundSrc from "assets/audio/interact.mp3";
import introBounceSrc from "assets/audio/intro-bounce.mp3";
import mitoBaseSrc from "assets/audio/mito-base.mp3";
import mitoDrumsSrc from "assets/audio/mito-drums.mp3";
import mitoOverworldMp3 from "assets/audio/mito-overworld.mp3";
import mitoStartScreenMp3 from "assets/audio/mito-start.mp3";
import mitoStringsSrc from "assets/audio/mito-strings.mp3";
import mitoDeathMp3 from "assets/audio/mitodeath.mp3";
import stickySoundSrc from "assets/audio/sticky.mp3";
import suckWaterSrc from "assets/audio/suckwater.wav";
import clickGenericSrc from "assets/audio/switch23.wav";
import genePickUpSrc from "assets/audio/switch25.wav";
import whooshSrc from "assets/audio/whoosh.mp3";
import { SketchAudioContext } from "game/screens/sketch/sketch";
import { Howl } from "howler";
import { randFloat } from "math";
import * as THREE from "three";
import devlog from "../common/devlog";
import { Player } from "../core";
import { Tile } from "../core/tile";

export let mito: AudioUnit;
export let strings: AudioUnit;
export let drums: AudioUnit;

export const clickGeneric = new Howl({
  src: [clickGenericSrc],
  volume: 0.2,
});

export function playSmallRand(howl: Howl) {
  const id = howl.play();
  howl.rate(randFloat(0.9, 1.1), id);
}

export const genePickUp = new Howl({
  src: [genePickUpSrc],
});

export const geneDrop = new Howl({
  src: [require("assets/audio/switch26.wav")],
});

export const moveBumped = new Howl({
  src: [require("assets/audio/rollover6.wav")],
});

export const mitoDeath = new Howl({
  src: mitoDeathMp3,
  autoplay: false,
  loop: true,
  volume: 1,
});

export const mitoStartScreen = new Howl({
  src: mitoStartScreenMp3,
  autoplay: false,
  loop: true,
  volume: 0.3,
});

export const mitoOverworld = new Howl({
  src: mitoOverworldMp3,
  autoplay: false,
  loop: true,
  volume: 0.15,
});

export const footsteps = new Howl({
  src: [footstepsSrc],
  autoplay: true,
  loop: true,
  volume: 0,
});

export const interactSound = new Howl({
  src: [interactSoundSrc],
  autoplay: true,
  loop: true,
  volume: 0,
});

export const introBounce = new Howl({
  src: introBounceSrc,
  volume: 0.5,
});

export const whoosh = new Howl({
  src: whooshSrc,
  volume: 0.2,
});

export const fruitPoof = new Howl({
  src: fruitPoofSrc,
  volume: 0.3,
});

export const build = new Howl({
  src: [buildSoundSrc],
  volume: 0.1,
});

export const buildComplete = new Howl({
  src: [buildCompleteSrc],
  volume: 0.5,
});

export const deconstruct = new Howl({
  src: [deconstructSoundSrc],
  volume: 0.5,
});

export const sticky = new Howl({
  src: [stickySoundSrc],
});

export const dropSugar = new Howl({
  src: [impactSoftMedium003Src],
  volume: 0.5,
});

export const dropWater = new Howl({
  src: [dropWaterSrc],
});

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
export const blopBuffer = loadAudioPromise(blopSrc);
export const suckWaterBuffer = loadAudioPromise(suckWaterSrc);
export const eatBuffer = loadAudioPromise(eatingSoundSrc);

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
  mito = makeUnitFromAudioAsset(ctx, mitoBaseSrc);
  mito.audio.oncanplaythrough = oneMoreLoaded;
  mito.gain.gain.value = 0.25;

  strings = makeUnitFromAudioAsset(ctx, mitoStringsSrc);
  strings.audio.oncanplaythrough = oneMoreLoaded;
  strings.gain.gain.value = 0.0;

  drums = makeUnitFromAudioAsset(ctx, mitoDrumsSrc);
  drums.audio.oncanplaythrough = oneMoreLoaded;
  drums.gain.gain.value = 0.0;
}

function sourceElement(src: string) {
  const type = src.substr(src.length - 3);
  const source = document.createElement("source");
  source.src = src;
  source.type = `audio/${type}`;
  return source;
}

function makeUnitFromAudioAsset(ctx: SketchAudioContext, ...srcs: string[]): AudioUnit {
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

interface AudioUnit {
  gain: GainNode;
  audio: HTMLAudioElement;
}

export function distScalar(source: Tile, player: Player) {
  const dist = source.pos.distanceToSquared(player.pos);
  const scalar = Math.min(1, 1 / (1 + dist / 25));
  return scalar;
}
