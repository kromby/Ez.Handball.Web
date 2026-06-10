import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "../api/money";
import { useAuth } from "../auth/useAuth";
import { BallDefs } from "../components/BallAvatar";
import { SketchBox } from "../components/SketchBox";
import { COURT_ORDER, SquadCourt } from "../components/squad/SquadCourt";
import { SelectedPlayerPanel } from "../components/squad/SelectedPlayerPanel";
import { ErrorView, Loading } from "../components/StateViews";
import { useSquad, useSquadConstraints } from "../query/hooks";

/** First owned player in court order — the default selection on load. */
function firstByCourtOrder(players: { playerId: string; position: string | null }[]): string | null {
  for (const code of COURT_ORDER) {
    const owned = players.find((candidate) => candidate.position === code);
    if (owned) return owned.playerId;
  }
  return players[0]?.playerId ?? null;
}

function Pill({ label, value, amber }: { label: string; value: string; amber?: boolean }) {
  return (
    <SketchBox tone={amber ? "amber" : "paper"} radius={12} pad="8px 15px" className="squad-pill">
      <div className="poslabel">{label}</div>
      <div className={`squad-pill-v${amber ? " amber" : ""}`}>{value}</div>
    </SketchBox>
  );
}

export default function SquadPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const squad = useSquad();
  const constraints = useSquadConstraints();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (squad.isPending || constraints.isPending) return <Loading />;
  if (squad.isError) return <ErrorView error={squad.error} notFoundLabel={t("squad.notFound")} />;
  if (constraints.isError) return <ErrorView error={constraints.error} notFoundLabel={t("squad.notFound")} />;

  const { players, remainingBudget, squadValue } = squad.data;
  const { maxSquadSize } = constraints.data;

  // If the selected player was sold (no longer in the squad), fall back to the natural first pick.
  const activeId = players.some((p) => p.playerId === selectedId) ? selectedId : firstByCourtOrder(players);
  const selected = players.find((p) => p.playerId === activeId) ?? null;
  const teamName = user?.teamName ?? t("squad.title");

  return (
    <section className="stack squad-page">
      <BallDefs />

      <div className="squad-head">
        <div>
          {user?.displayName && <div className="scribble squad-eyebrow">{user.displayName}</div>}
          <h1 className="title">{teamName}</h1>
        </div>
        <div className="squad-pills">
          <Pill label={t("squad.squadValue")} value={formatMoney(squadValue)} />
          <Pill label={t("squad.remaining")} value={formatMoney(remainingBudget)} amber />
          <Pill label={t("squad.size")} value={`${players.length} / ${maxSquadSize}`} />
        </div>
      </div>

      <div className="squad-grid">
        <SquadCourt players={players} selectedId={activeId} onSelect={setSelectedId} />

        <div className="squad-rail">
          <SelectedPlayerPanel player={selected} />
        </div>
      </div>
    </section>
  );
}
