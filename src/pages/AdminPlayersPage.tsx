import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminNav } from "../components/AdminNav";
import { PlayerPositionEditor } from "../components/adminPlayers/PlayerPositionEditor";
import { SearchInput } from "../components/SearchInput";
import { ErrorView, Loading } from "../components/StateViews";
import { useAdminPlayersMissingPosition, usePlayers } from "../query/hooks";

const MIN_SEARCH_LENGTH = 2;
const SEARCH_LIMIT = 20;

function PlayersTable({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
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
      <tbody>{children}</tbody>
    </table>
  );
}

function SearchResults({ name }: { name: string }) {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = usePlayers({ name, limit: SEARCH_LIMIT });

  if (isPending) return <Loading />;
  if (isError) return <ErrorView error={error} notFoundLabel={t("admin.players.notFound")} />;
  if (data.entries.length === 0) return <p className="status">{t("admin.players.searchEmpty")}</p>;

  return (
    <PlayersTable>
      {data.entries.map((player) => (
        <tr key={player.playerId}>
          <td>{player.name}</td>
          <td>{player.clubName ?? "—"}</td>
          <td>{player.gender}</td>
          <td>
            <PlayerPositionEditor
              playerId={player.playerId}
              position={player.position}
              positionSecondary={player.positionSecondary}
            />
          </td>
        </tr>
      ))}
    </PlayersTable>
  );
}

function PlayerSearch() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const query = name.trim();

  return (
    <section className="stack">
      <h2 className="poslabel">{t("admin.players.searchTitle")}</h2>
      <SearchInput
        initialValue=""
        placeholder={t("admin.players.search")}
        clearLabel={t("playerHub.clearSearch")}
        onSearch={setName}
      />
      {query.length >= MIN_SEARCH_LENGTH && <SearchResults name={query} />}
    </section>
  );
}

function MissingPositionList() {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useAdminPlayersMissingPosition();

  let body: React.ReactNode;
  if (isPending) body = <Loading />;
  else if (isError) body = <ErrorView error={error} notFoundLabel={t("admin.players.notFound")} />;
  else if (data.length === 0) body = <p className="status">{t("admin.players.empty")}</p>;
  else
    body = (
      <PlayersTable>
        {data.map((player) => (
          <tr key={player.playerId}>
            <td>{player.name}</td>
            <td>{player.clubName ?? "—"}</td>
            <td>{player.gender}</td>
            <td>
              <PlayerPositionEditor
                playerId={player.playerId}
                position={player.position}
                positionSecondary={player.positionSecondary}
              />
            </td>
          </tr>
        ))}
      </PlayersTable>
    );

  return (
    <section className="stack">
      <h2 className="poslabel">{t("admin.players.missingTitle")}</h2>
      {body}
    </section>
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
      <PlayerSearch />
      <MissingPositionList />
    </section>
  );
}
