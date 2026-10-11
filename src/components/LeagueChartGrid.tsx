import { CHART_MARGIN } from "../lib/leagueChart";

interface Props {
  ticks: number[];
  width: number;
  yOf: (value: number) => number;
}

/** The dashed horizontal grid lines and value labels shared by the league charts. */
export function LeagueChartGrid({ ticks, width, yOf }: Props) {
  return (
    <>
      {ticks.map((value) => (
        <g key={value}>
          <line className="league-chart-grid" x1={CHART_MARGIN.left} x2={width - CHART_MARGIN.right} y1={yOf(value)} y2={yOf(value)} />
          <text className="league-chart-tick" x={CHART_MARGIN.left - 8} y={yOf(value)} textAnchor="end" dominantBaseline="middle">
            {value}
          </text>
        </g>
      ))}
    </>
  );
}
