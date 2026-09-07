import { useTranslation } from "react-i18next";
import type { PlayerMissingPosition } from "../api/types";
import { AdminNav } from "../components/AdminNav";
import { ErrorView, Loading } from "../components/StateViews";
import { useAdminPlayersMissingPosition, useSetPlayerPosition } from "../query/hooks";

const POSITION_CODES = ["GK", "LW", "RW", "LB", "CB", "RB", "LP"];

function PlayerRow({ player }: { player: PlayerMissingPosition }) {
  const { t } = useTranslation();
  const setPosition = useSetPlayerPosition();

  return (
    <tr>
      <td>{player.name}</td>
      <td>{player.clubName ?? "—"}</td>
      <td>{player.gender}</td>
      <td>
        <select
          aria-label={t("admin.players.position")}
          value={player.position ?? ""}
          disabled={setPosition.isPending}
          onChange={(e) => setPosition.mutate({ playerId: player.playerId, position: e.target.value })}
        >
          <option value="">{t("admin.players.choosePosition")}</option>
          {POSITION_CODES.map((code) => (
            <option key={code} value={code}>{t(`positions.${code}`, { defaultValue: code })}</option>
          ))}
        </select>
        {setPosition.isPending && <span className="form-note">{t("admin.players.saving")}</span>}
        {setPosition.isError && <span className="form-error" role="alert">{t("admin.players.saveError")}</span>}
      </td>
    </tr>
  );
}

function PlayersBody() {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useAdminPlayersMissingPosition();

  if (isPending) return <Loading />;
  if (isError) return <ErrorView error={error} notFoundLabel={t("admin.players.notFound")} />;
  if (data.length === 0) return <p className="status">{t("admin.players.empty")}</p>;

  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th>{t("admin.players.name")}</th>
          <th>{t("admin.players.club")}</th>
          <th>{t("admin.players.gender")}</th>
          <th>{t("admin.players.position")}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((player) => (
          <PlayerRow key={player.playerId} player={player} />
        ))}
      </tbody>
    </table>
  );
}

export default function AdminPlayersPage() {
  const { t } = useTranslation();
  return (
    <section className="stack">
      <AdminNav />
      <header>
        <div className="scribble">{t("admin.eyebrow")}</div>
        <h1 className="title">{t("admin.players.title")}</h1>
      </header>
      <PlayersBody />
    </section>
  );
}
