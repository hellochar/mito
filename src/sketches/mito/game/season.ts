import { TIME_PER_DAY, TIME_PER_MONTH, TIME_PER_SEASON, TIME_PER_YEAR } from "../../../core/constants";
export interface Season {
  year: number;
  season: 0 | 1 | 2 | 3;
  /**
   * month 1, 2, or 3 in the season.
   */
  month: number;
  /**
   * Percent done with the season total.
   */
  percent: number;
  day: number;
}

export function seasonFromTime(time: number): Season {
  const year = Math.floor(time / TIME_PER_YEAR);
  const timeInYear = time % TIME_PER_YEAR;
  const season = Math.floor(timeInYear / TIME_PER_SEASON) as Season["season"];
  const percent = (timeInYear % TIME_PER_SEASON) / TIME_PER_SEASON;
  const month = Math.floor((timeInYear % TIME_PER_SEASON) / TIME_PER_MONTH) + 1;
  const day = Math.floor((timeInYear % TIME_PER_MONTH) / TIME_PER_DAY) + 1;
  return {
    year,
    season,
    percent,
    month,
    day,
  };
}

export const SEASON_NAMES = ["Spring", "Summer", "Fall", "Winter"];

export function seasonDisplay(s: Season) {
  return `${s.year > 0 ? `Year ${s.year}, ` : ""}${SEASON_NAMES[s.season]}, Month ${s.month}`;
}
