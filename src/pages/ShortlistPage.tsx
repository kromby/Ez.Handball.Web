import { useTranslation } from "react-i18next";
import type { ShortlistItem } from "../api/types";
import { Panel } from "../components/Panel";
import { PlayerTable, type PlayerColumn } from "../components/PlayerTable";
import { ErrorView, Loading } from "../components/StateViews";
import { useShortlist } from "../query/hooks";

export default function ShortlistPage() {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useShortlist();

  const after: PlayerColumn<ShortlistItem>[] = [
    { key: "position", header: t("shortlist.position"), render: (r) => r.position ?? "—" },
  ];

  return (
    <section className="stack">
      <div className="page-head">
        <h1 className="title">{t("shortlist.title")}</h1>
        {data && <p className="subtitle">{t("shortlist.countOfMax", { count: data.count, max: data.max })}</p>}
      </div>
      {isPending && <Loading />}
      {isError && <ErrorView error={error} notFoundLabel={t("shortlist.notFound")} />}
      {data && (
        <Panel>
          <PlayerTable<ShortlistItem>
            rows={data.items}
            after={after}
            emptyLabel={t("shortlist.empty")}
          />
        </Panel>
      )}
    </section>
  );
}
