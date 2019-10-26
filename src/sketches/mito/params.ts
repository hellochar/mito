import { parse, stringify } from "query-string";
import { ALL_ENVIRONMENTS } from "./game/environment";

const PARAMS_DEFAULT = {
  isRealtime: true,
  environment: "Temperate" as keyof typeof ALL_ENVIRONMENTS,
  cellEnergyMax: 6750,
  tissueInventoryCapacity: 6,
  rootTurnsPerTransfer: 40,
  leafReactionRate: 0.01,
  leafSugarPerReaction: 1,
  cellGestationTurns: 20,
  cellDiffusionWater: 0.002,
  cellDiffusionSugar: 0.002,
  soilDarknessBase: 0.2,
  soilDiffusionWater: 0.001,
  veinDiffusion: 0.5,
  soilMaxWater: 20,
  droop: 0.03,
  fountainTurnsPerWater: 11,
  fountainAppearanceRate: 1.5,
  transportTurnsPerMove: 5,
  sunlightReintroduction: 0.15,
  sunlightDiffusion: 0.0,
  maxResources: 100,
};

type Params = typeof PARAMS_DEFAULT;

export const params = { ...PARAMS_DEFAULT };

const search = parse(window.location.search);
if (search.params != null) {
  const urlHashParams: object = JSON.parse(search.params as string);
  Object.assign(params, urlHashParams);
}

export function updateParamsHash() {
  const nonDefaultParams: Partial<Params> = {};
  const keys = Object.keys(PARAMS_DEFAULT) as Array<keyof Params>;
  for (const key of keys) {
    const k = params[key];
    if (k !== PARAMS_DEFAULT[key]) {
      nonDefaultParams[key] = k as any;
    }
  }
  if (Object.keys(nonDefaultParams).length > 0) {
    const stringified = stringify({
      ...(parse(window.location.search)),
      params: JSON.stringify(nonDefaultParams),
    });
    window.location.search = stringified;
  } else {
  }
}
updateParamsHash();
