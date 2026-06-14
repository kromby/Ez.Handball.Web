import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import type { Gameweek } from "../api/types";
import { GameweekHeroCard } from "../components/gameweek/GameweekHeroCard";
import { GameweekListRow } from "../components/gameweek/GameweekListRow";
import { roundByLabel, sectionGameweeks } from "../components/gameweek/gameweekLabels";
import { Loading } from "../components/StateViews";
import { useCurrentGameweek, useGameweeks, useRounds } from "../query/hooks";

function isConfigError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "gameweek_config_missing" || error.code === "tournament_not_found")
  );
}

function NotConfigured() {
  const { t } = useTranslation();
  return (
    <section className="gw-empty">
      <h2 className="title">{t("gameweek.notConfigured")}</h2>
      <p className="subtitle">{t("gameweek.notConfiguredBody")}</p>
    </section>
  );
}

export default function GameweeksPage() {
  const { t } = useTranslation();
  const gameweeks = useGameweeks();
  const currentQ = useCurrentGameweek();

  const all: Gameweek[] = gameweeks.data ?? [];
  const tournamentId = all[0]?.tournamentId ?? currentQ.data?.current?.tournamentId;
  const rounds = useRounds(tournamentId);

  if (gameweeks.isPending || currentQ.isPending) return <Loading />;
  if (isConfigError(gameweeks.error) || isConfigError(currentQ.error)) return <NotConfigured />;
  if (gameweeks.isError || currentQ.isError) return <NotConfigured />;

  const current = currentQ.data?.current ?? null;
  const lastSettled = currentQ.data?.lastSettled ?? null;
  const { hero, comingUp, results } = sectionGameweeks(all, current, lastSettled);

  if (!hero) {
    return (
      <section className="stack gw-page">
        <p className="subtitle">{t("gameweek.empty")}</p>
      </section>
    );
  }

  const season = rounds.data?.season ?? "";

  return (
    <section className="stack gw-page">
      <header className="gw-page-head">
        <div className="scribble gw-page-eyebrow">{t("gameweek.pageEyebrow")}</div>
        <h1 className="title">{t("gameweek.pageTitle")}</h1>
        <div className="gw-season-chip">
          <span className="poslabel">{t("gameweek.seasonChip", { season })}</span>
          <span className="gw-season-round">{t("gameweek.roundOf", { current: hero.number, total: all.length })}</span>
        </div>
      </header>

      <GameweekHeroCard gameweek={hero} current={current} round={roundByLabel(rounds.data, hero.roundLabel)} />

      {comingUp.length > 0 && (
        <div className="gw-section">
          <div className="label gw-section-label">{t("gameweek.comingUp")}</div>
          {comingUp.map((g) => (
            <GameweekListRow key={g.number} gameweek={g} current={current} round={roundByLabel(rounds.data, g.roundLabel)} />
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="gw-section">
          <div className="label gw-section-label">{t("gameweek.results")}</div>
          {results.map((g) => (
            <GameweekListRow key={g.number} gameweek={g} current={current} round={roundByLabel(rounds.data, g.roundLabel)} />
          ))}
        </div>
      )}
    </section>
  );
}
