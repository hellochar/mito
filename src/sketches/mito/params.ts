import { parse, stringify } from "query-string";

const PARAMS_DEFAULT = {
  droop: 0.13,
  sunlightReintroduction: 0.15,
  sunlightDiffusion: 0.0,
  hud: true,
  debug: process.env.NODE_ENV === "development",
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
      ...parse(window.location.search),
      params: JSON.stringify(nonDefaultParams),
    });
    window.location.search = stringified;
  } else {
  }
}
updateParamsHash();
