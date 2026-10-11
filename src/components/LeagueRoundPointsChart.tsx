import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ManagerStanding } from "../api/types";
import { CHART_HEIGHT, CHART_MARGIN, roundLabelsOf, seriesColorOf, valueScaleOf } from "../lib/leagueChart";
import { useElementWidth } from "../lib/useElementWidth";
import { LeagueChartGrid } from "./LeagueChartGrid";
import { LeagueChartLegend } from "./LeagueChartLegend";

// Space left empty between one round's group of bars and the next.
const ROUND_GAP = 0.25;
// Bars never get thinner than this; past it the chart scrolls sideways inside its box.
const MIN_BAR_WIDTH = 4;
// Keeps a group from turning into wide blocks when there are only a few rounds.
const MAX_BAR_WIDTH = 18;

interface Props {
  entries: ManagerStanding[];
  myTeamId: string | undefined;
}

/** Points each team scored in each settled round, as a grouped bar chart. */
export function LeagueRoundPointsChart({ entries, myTeamId }: Props) {
  const { t } = useTranslation();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const availableWidth = useElementWidth(container);
  // When the season is too long to fit, start at the latest rounds — they are the news.
  useEffect(() => {
    if (container) container.scrollLeft = container.scrollWidth;
  }, [container, availableWidth]);
  const labels = roundLabelsOf(entries);
  if (labels.length === 0) return null;

  const colorByTeam = seriesColorOf(entries, myTeamId);
  const pointsByTeam = new Map(entries.map((entry) => [
    entry.teamId,
    new Map(entry.rounds.map((round) => [round.roundLabel, round.points])),
  ]));
  const scale = valueScaleOf(entries.flatMap((entry) => entry.rounds.map((round) => round.points)));

  const minRoundWidth = (entries.length * MIN_BAR_WIDTH) / (1 - ROUND_GAP);
  const plotWidth = Math.max(availableWidth - CHART_MARGIN.left - CHART_MARGIN.right, labels.length * minRoundWidth);
  const width = plotWidth + CHART_MARGIN.left + CHART_MARGIN.right;
  const plotHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const roundWidth = plotWidth / labels.length;
  const barWidth = Math.min((roundWidth * (1 - ROUND_GAP)) / entries.length, MAX_BAR_WIDTH);
  const groupWidth = barWidth * entries.length;

  const roundCenterOf = (roundIndex: number) => CHART_MARGIN.left + (roundIndex + 0.5) * roundWidth;
  const yOf = (points: number) => CHART_MARGIN.top + plotHeight - ((points - scale.min) / (scale.max - scale.min)) * plotHeight;

  return (
    <div className="league-chart">
      <div className="league-chart-scroll" ref={setContainer}>
        <svg width={width} height={CHART_HEIGHT} viewBox={`0 0 ${width} ${CHART_HEIGHT}`} role="img" aria-label={t("leagues.roundChartLabel")}>
          <LeagueChartGrid ticks={scale.ticks} width={width} yOf={yOf} />
          {labels.map((label, roundIndex) => (
            <text key={label} className="league-chart-tick" x={roundCenterOf(roundIndex)} y={CHART_HEIGHT - 6} textAnchor="middle">
              {label}
            </text>
          ))}
          {entries.map((entry, teamIndex) => {
            const isMine = entry.teamId === myTeamId;
            return (
              <g
                key={entry.teamId}
                className={isMine ? "league-chart-bars league-chart-bars--mine" : "league-chart-bars"}
                style={{ color: colorByTeam.get(entry.teamId) }}
                fill="currentColor"
              >
                {labels.map((label, roundIndex) => {
                  const points = pointsByTeam.get(entry.teamId)?.get(label);
                  // No score that round, so no bar — a zero is a real score and still gets a sliver.
                  if (points === undefined) return null;
                  const top = Math.min(yOf(points), yOf(0));
                  return (
                    <rect
                      key={label}
                      x={roundCenterOf(roundIndex) - groupWidth / 2 + teamIndex * barWidth}
                      y={top}
                      width={barWidth}
                      height={Math.max(Math.abs(yOf(points) - yOf(0)), 1)}
                    >
                      <title>{`${entry.teamName} · ${t("leagues.round", { label })}: ${points}`}</title>
                    </rect>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <LeagueChartLegend entries={entries} myTeamId={myTeamId} colorByTeam={colorByTeam} />
    </div>
  );
}
