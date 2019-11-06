import { sampleArray } from "math";
import names from "./plantNames";

const generateSpeciesName = () => {
  return sampleArray(names);
};

export default generateSpeciesName;
