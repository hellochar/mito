import { TIME_PER_MONTH, TIME_PER_SEASON } from "./constants";
export interface Season {
  percent: number;
  season: 0 | 1 | 2 | 3;
  month: number;
}
export function seasonFromTime(time: number): Season {
  const season = Math.floor(time / TIME_PER_SEASON) as Season["season"];
  const percent = (time % TIME_PER_SEASON) / TIME_PER_SEASON; // percent done with this season
  const month = Math.floor((time % TIME_PER_SEASON) / TIME_PER_MONTH) + 1;
  return {
    season,
    percent,
    month,
  };
}
const SEASON_NAMES = ["Spring", "Summer", "Fall", "Winter"];
export function seasonDisplay(s: Season) {
  return `${SEASON_NAMES[s.season]}, Month ${s.month}`;
}
