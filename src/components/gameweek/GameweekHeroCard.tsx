import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Gameweek, RoundGroup } from "../../api/types";
import { FixtureRow } from "./FixtureRow";
import { gameweekLabelKey, isCurrent } from "./gameweekLabels";
import { GameweekStatusPill } from "./GameweekStatusPill";
import { useCountdown } from "./useCountdown";

export function GameweekHeroCard({
  gameweek,
  current,
  round,
}: {
  gameweek: Gameweek;
  current: Gameweek | null;
  round: RoundGroup | undefined;
}) {
  const { t } = useTranslation();
  const countdown = useCountdown(gameweek.deadline);
  const currentNow = isCurrent(gameweek, current);

  return (
    <section className="gw-hero">
      <header className="gw-hero-head">
        <h2 className="gw-hero-title">{t("gameweek.heroTitle", { number: gameweek.number })}</h2>
        <span className="gw-hero-round">{t("gameweek.roundLabel", { label: gameweek.roundLabel })}</span>
        <GameweekStatusPill labelKey={gameweekLabelKey(gameweek.status, currentNow)} />
      </header>

      <div className="gw-countdown gw-hero-countdown">
        {countdown.locked ? t("gameweek.locked") : t("gameweek.locksIn", { countdown: countdown.label })}
      </div>

      <div className="gw-hero-fixtures">
        {round && round.matches.length > 0 ? (
          round.matches.map((m) => <FixtureRow key={m.matchId} match={m} />)
        ) : (
          <p className="gw-empty-note">{t("gameweek.noFixtures")}</p>
        )}
      </div>

      <footer className="gw-hero-foot">
        <Link to="/squad" className="gw-hero-scribble">
          {t("gameweek.setYourSeven")} →
        </Link>
        <Link to="/squad" className="gw-cta-button">
          {t("gameweek.editSquadCta")}
        </Link>
      </footer>
    </section>
  );
}
