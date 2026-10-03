import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { formatMoney } from "../api/money";
import { BuyButton } from "../components/BuyButton";
import { ClubLink } from "../components/ClubLink";
import { Panel } from "../components/Panel";
import { PlayerMatchTable } from "../components/PlayerMatchTable";
import { SellButton } from "../components/SellButton";
import { StarToggle } from "../components/StarToggle";
import { StatTable } from "../components/StatTable";
import { StatCell, driftValue } from "../components/squad/StatCell";
import { ErrorView, Loading } from "../components/StateViews";
import { useClubs, usePlayer, usePlayerHistory, usePlayerStats, useSquad } from "../query/hooks";

function formatBirthday(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function PlayerPage() {
  const { t } = useTranslation();
  const { playerId = "" } = useParams();
  const profile = usePlayer(playerId);
  const history = usePlayerHistory(playerId);
  const stats = usePlayerStats(playerId);
  const squad = useSquad();
  const clubs = useClubs();

  if (profile.isPending) return <Loading />;
  if (profile.isError) return <ErrorView error={profile.error} notFoundLabel={t("player.notFound")} />;

  const p = profile.data;
  const ownedPlayer = squad.data?.players.find((sp) => sp.playerId === p.playerId) ?? null;
  const owned = ownedPlayer !== null;
  const drift = ownedPlayer?.price ? ownedPlayer.price.amount - ownedPlayer.pricePaid.amount : null;
  const metaBits = [p.age != null ? t("player.age", { age: p.age }) : null, formatBirthday(p.dateOfBirth)].filter(
    Boolean,
  );
  const metaText = metaBits.join(" · ");
  const clubLogoUrl = clubs.data?.find((club) => club.clubId === p.clubId)?.logoUrl ?? null;

  return (
    <section className="stack">
      <div className="page-head">
        <div className="title-row">
          <h1 className="title">
            {p.jerseyNumber && <span className="jersey">#{p.jerseyNumber}</span>}
            {p.name}
            {p.retired && <span className="retired-badge">{t("player.retired")}</span>}
          </h1>
          <StarToggle playerId={playerId} name={p.name} />
          {owned ? (
            <SellButton player={{ playerId: p.playerId, name: p.name }} />
          ) : p.retired ? null : (
            <BuyButton player={{ playerId: p.playerId, name: p.name, position: p.position ?? null, price: p.price ?? null }} />
          )}
        </div>
        <p className="subtitle">
          {p.clubName ? (
            <ClubLink clubId={p.clubId} className="club-inline">
              {clubLogoUrl && <img className="club-logo-sm" src={clubLogoUrl} alt="" />}
              {p.clubName}
            </ClubLink>
          ) : null}
          {p.clubName && p.position ? " · " : null}
          {p.position && (
            <span className="token-badge token-badge--lg">
              {t(`positions.${p.position}`, { defaultValue: p.position })}
            </span>
          )}
          {(p.clubName || p.position) && metaText ? " · " : null}
          {metaText}
        </p>
        {(p.rating != null || p.price != null) && (
          <div className="panel-stats fantasy-stats">
            <StatCell label={t("player.rating")} value={p.rating != null ? p.rating.toFixed(0) : "—"} />
            <StatCell label={t("player.price")} value={formatMoney(p.price ?? null)} valueClassName="amber" />
            {ownedPlayer && (
              <StatCell label={t("squad.paidLabel")} value={formatMoney(ownedPlayer.pricePaid)} />
            )}
            {ownedPlayer && drift !== null && (
              <StatCell
                label={t("squad.drift")}
                value={driftValue(drift, ownedPlayer.pricePaid.currency)}
                valueClassName={drift >= 0 ? "drift-up" : "drift-down"}
                testId="drift"
              />
            )}
          </div>
        )}
      </div>

      <Panel>
        <h2 className="section-title">{t("player.seasonHistory")}</h2>
        {history.isPending && <Loading />}
        {history.isError && <ErrorView error={history.error} notFoundLabel={t("player.noHistory")} />}
        {history.data &&
          (history.data.history.length === 0 ? (
            <p className="status">{t("match.noMatches")}</p>
          ) : (
            <StatTable entries={history.data.history} totals={history.data.totals} />
          ))}
      </Panel>

      <Panel>
        <h2 className="section-title">{t("player.matches")}</h2>
        {stats.isPending && <Loading />}
        {stats.isError && <ErrorView error={stats.error} notFoundLabel={t("player.noMatches")} />}
        {stats.data && <PlayerMatchTable stats={stats.data.stats} />}
      </Panel>
    </section>
  );
}
