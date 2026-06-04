import type { ShortlistItem } from "../api/types";
import { Panel } from "../components/Panel";
import { PlayerTable, type PlayerColumn } from "../components/PlayerTable";
import { ErrorView, Loading } from "../components/StateViews";
import { useShortlist } from "../query/hooks";

const after: PlayerColumn<ShortlistItem>[] = [
  { key: "position", header: "Pos", render: (r) => r.position ?? "—" },
];

export default function ShortlistPage() {
  const { data, isPending, isError, error } = useShortlist();

  return (
    <section className="stack">
      <div className="page-head">
        <h1 className="title">Your shortlist</h1>
        {data && <p className="subtitle">{data.count} / {data.max}</p>}
      </div>
      {isPending && <Loading />}
      {isError && <ErrorView error={error} notFoundLabel="Shortlist not found" />}
      {data && (
        <Panel>
          <PlayerTable<ShortlistItem>
            rows={data.items}
            after={after}
            emptyLabel="No players yet — star players from the leaderboard to track them."
          />
        </Panel>
      )}
    </section>
  );
}
