import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatMoney } from "../api/money";
import type { SquadPlayer } from "../api/types";
import { BudgetMeter } from "../components/BudgetMeter";
import { Panel } from "../components/Panel";
import { PositionGroup } from "../components/PositionGroup";
import { SellButton } from "../components/SellButton";
import { ErrorView, Loading } from "../components/StateViews";
import { useSquad, useSquadConstraints } from "../query/hooks";

/** Position label with a graceful fallback to the raw code. */
function usePositionLabel() {
  const { t } = useTranslation();
  return (code: string) => t(`positions.${code}`, { defaultValue: code });
}

export default function SquadPage() {
  const { t } = useTranslation();
  const squad = useSquad();
  const constraints = useSquadConstraints();
  const posLabel = usePositionLabel();

  if (squad.isPending || constraints.isPending) return <Loading />;
  if (squad.isError) return <ErrorView error={squad.error} notFoundLabel={t("squad.notFound")} />;
  if (constraints.isError) return <ErrorView error={constraints.error} notFoundLabel={t("squad.notFound")} />;

  const { players, remainingBudget, budgetUsed, squadValue } = squad.data;
  const { maxSquadSize, posLimits } = constraints.data;

  // Group by position code, ordered by the constraints' declared positions, then any extras.
  const codes = Object.keys(posLimits);
  const extra = [...new Set(players.map((p) => p.position).filter((c): c is string => !!c && !codes.includes(c)))];
  const ordered = [...codes, ...extra];
  const byCode = new Map<string, SquadPlayer[]>();
  for (const p of players) {
    const code = p.position ?? "—";
    byCode.set(code, [...(byCode.get(code) ?? []), p]);
  }

  return (
    <section className="stack">
      <div className="page-head">
        <h1 className="title">{t("squad.title")}</h1>
      </div>
      <Panel>
        <BudgetMeter remaining={remainingBudget} used={budgetUsed} value={squadValue} size={players.length} maxSize={maxSquadSize} />
      </Panel>

      {players.length === 0 ? (
        <Panel>
          <p className="status">
            {t("squad.empty")} <Link to="/market">{t("squad.goToMarket")}</Link>
          </p>
        </Panel>
      ) : (
        <Panel>
          {ordered
            .filter((code) => (byCode.get(code) ?? []).length > 0 || posLimits[code] != null)
            .map((code) => {
              const members = byCode.get(code) ?? [];
              if (members.length === 0) return null;
              return (
                <PositionGroup key={code} label={posLabel(code)} owned={members.length} limit={posLimits[code] ?? members.length}>
                  {members.map((p) => (
                    <li key={p.playerId} className="squad-row">
                      <Link to={`/players/${encodeURIComponent(p.playerId)}`}>{p.name ?? t("match.unknownPlayer")}</Link>
                      <span className="squad-row-price">
                        {t("squad.paid", { price: formatMoney(p.pricePaid) })}
                        {p.price && p.price.amount !== p.pricePaid.amount && (
                          <span className="squad-row-now"> ({t("squad.now", { price: formatMoney(p.price) })})</span>
                        )}
                      </span>
                      <SellButton player={{ playerId: p.playerId, name: p.name }} />
                    </li>
                  ))}
                </PositionGroup>
              );
            })}
        </Panel>
      )}
    </section>
  );
}
