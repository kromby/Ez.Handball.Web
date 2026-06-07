import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import { useSellPlayer } from "../query/hooks";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

function errorKey(err: unknown) {
  if (err instanceof ApiError) {
    if (err.code === "not_in_squad") return "sell.errorNotInSquad";
    if (err.code === "no_team") return "buy.errorNoTeam";
  }
  return "common.error";
}

export function SellButton({ player }: { player: { playerId: string; name: string | null } }) {
  const { t } = useTranslation();
  const toast = useToast();
  const sell = useSellPlayer();
  const [open, setOpen] = useState(false);
  const name = player.name ?? t("match.unknownPlayer");

  const onConfirm = () => {
    sell.mutate(player.playerId, {
      onSuccess: () => setOpen(false),
      onError: (err) => { setOpen(false); toast.show(t(errorKey(err))); },
    });
  };

  return (
    <>
      <button type="button" className="sell-btn" onClick={() => setOpen(true)} aria-label={t("sell.sellName", { name })}>
        {t("sell.sell")}
      </button>
      <ConfirmDialog
        open={open}
        title={t("sell.confirmTitle", { name })}
        body={t("sell.confirmBody")}
        confirmLabel={t("sell.sell")}
        cancelLabel={t("sell.cancel")}
        busy={sell.isPending}
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
