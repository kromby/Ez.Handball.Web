import type { ManagerStanding } from "../api/types";

export const CHART_HEIGHT = 200;
export const CHART_MARGIN = { top: 10, right: 12, bottom: 24, left: 36 };
const GRID_LINES = 4;
// Matches the --series-N custom properties in app.css.
const SERIES_COLOR_COUNT = 8;

// Every team shares the same settled rounds except ones it has no score for, so the
// longest history is a good axis; labels only a shorter history has are appended.
export function roundLabelsOf(entries: ManagerStanding[]): string[] {
  const labels: string[] = [];
  const longestFirst = [...entries].sort((first, second) => second.rounds.length - first.rounds.length);
  for (const entry of longestFirst) {
    for (const round of entry.rounds) {
      if (!labels.includes(round.roundLabel)) labels.push(round.roundLabel);
    }
  }
  return labels;
}

// Team colours from the API often repeat, so the charts hand out their own palette:
// rivals take the series colours in standings order, and the viewer's team always gets
// the accent, which no series colour resembles.
export function seriesColorOf(entries: ManagerStanding[], myTeamId: string | undefined): Map<string, string> {
  const colorByTeam = new Map<string, string>();
  let rivalIndex = 0;
  for (const entry of entries) {
    if (entry.teamId === myTeamId) {
      colorByTeam.set(entry.teamId, "var(--accent)");
    } else {
      colorByTeam.set(entry.teamId, `var(--series-${(rivalIndex % SERIES_COLOR_COUNT) + 1})`);
      rivalIndex += 1;
    }
  }
  return colorByTeam;
}

export interface ValueScale {
  min: number;
  max: number;
  ticks: number[];
}

// Grid lines fall on round tens. The axis always includes zero, and reaches below it
// only when a value does — a round can score negative points.
export function valueScaleOf(values: number[]): ValueScale {
  const highest = Math.max(...values, 1);
  const lowest = Math.min(...values, 0);
  const step = Math.ceil((highest - lowest) / GRID_LINES / 10) * 10;
  const min = Math.floor(lowest / step) * step;
  const max = Math.ceil(highest / step) * step;
  const ticks = Array.from({ length: (max - min) / step + 1 }, (_, index) => min + index * step);
  return { min, max, ticks };
}
