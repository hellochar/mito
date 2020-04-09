import { randElement, randInt } from "math";
import capitalize from "./capitalize";

// taken from https://github.com/chancejs/chancejs/blob/63db6b8aab83513afa5a8269c8dcde6b300a9cf7/chance.js

const NUMBERS = "0123456789";
const CHARS_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHARS_UPPER = CHARS_LOWER.toUpperCase();

function character(options: any) {
  var symbols = "!@#$%^&*()[]",
    letters,
    pool;

  if (options.casing === "lower") {
    letters = CHARS_LOWER;
  } else if (options.casing === "upper") {
    letters = CHARS_UPPER;
  } else {
    letters = CHARS_LOWER + CHARS_UPPER;
  }

  if (options.pool) {
    pool = options.pool;
  } else {
    pool = "";
    if (options.alpha) {
      pool += letters;
    }
    if (options.numeric) {
      pool += NUMBERS;
    }
    if (options.symbols) {
      pool += symbols;
    }
    if (!pool) {
      pool = letters + NUMBERS + symbols;
    }
  }

  return pool.charAt(randInt(0, pool.length - 1));
}

function syllable() {
  let length = randInt(2, 3),
    consonants = "bcdfghjklmnprstvwz", // consonants except hard to speak ones
    vowels = "aeiou", // vowels
    all = consonants + vowels, // all
    text = "",
    chr;

  // I'm sure there's a more elegant way to do this, but this works
  // decently well.
  for (var i = 0; i < length; i++) {
    if (i === 0) {
      // First character can be anything
      chr = character({ pool: all });
    } else if (consonants.indexOf(chr) === -1) {
      // Last character was a vowel, now we want a consonant
      chr = character({ pool: consonants });
    } else {
      // Last character was a consonant, now we want a vowel
      chr = character({ pool: vowels });
    }

    text += chr;
  }

  return text;
}

function word(options?: { syllables?: number; length?: number }) {
  let syllables = options?.syllables || 2,
    text = "";

  if (options?.length) {
    // Either bound word by length
    do {
      text += syllable();
    } while (text.length < options.length);
    text = text.substring(0, options.length);
  } else {
    // Or by number of syllables
    for (var i = 0; i < syllables; i++) {
      text += syllable();
    }
  }

  return text;
}

const LANDSCAPES = [
  "@ Steppes",
  "@ Plains",
  "@ Area",
  "@ Basin",
  "@ Bend",
  "@ Beach",
  "@ Cape",
  "@ Flat",
  "@ Ridge",
  "@ Summit",
  "Mount @",
  "@'s Valley",
  "@ Hills",
  "@ Pinnacle",
  "@ Heights",
];
function addRandomLandscape(name: string) {
  const template = randElement(LANDSCAPES);
  return template.replace("@", name);
}

export function randomName() {
  return addRandomLandscape(capitalize(word()));
}
