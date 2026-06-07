import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Money, ShortlistItem } from "../api/types";
import { BuyButton } from "../components/BuyButton";
import { Panel } from "../components/Panel";
import { PlayerTable, type PlayerColumn } from "../components/PlayerTable";
import { ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../auth/useAuth";
import { usePlayerPool, useShortlist } from "../query/hooks";

export default function ShortlistPage() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const { data, isPending, isError, error } = useShortlist();
  const pool = usePlayerPool({ limit: 200 }, { enabled: status === "authenticated" });

  const priceById = useMemo(() => {
    const map = new Map<string, { position: string; price: Money }>();
    for (const e of pool.data?.entries ?? []) map.set(e.playerId, { position: e.position, price: e.price });
    return map;
  }, [pool.data]);

  const after: PlayerColumn<ShortlistItem>[] = [
    { key: "position", header: t("shortlist.position"), render: (r) => r.position ?? "—" },
    {
      key: "buy",
      header: "",
      render: (r) => {
        const info = priceById.get(r.playerId);
        return <BuyButton player={{ playerId: r.playerId, name: r.name, position: info?.position ?? r.position, price: info?.price ?? null }} />;
      },
    },
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
          <PlayerTable<ShortlistItem> rows={data.items} after={after} emptyLabel={t("shortlist.empty")} />
        </Panel>
      )}
    </section>
  );
}
