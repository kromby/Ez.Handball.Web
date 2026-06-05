import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";

export function Loading() {
  const { t } = useTranslation();
  return <p className="status">{t("common.loading")}</p>;
}

export function NotFound({ label }: { label: string }) {
  return <p className="status">{label}</p>;
}

export function ErrorView({ error, notFoundLabel }: { error: unknown; notFoundLabel: string }) {
  const { t } = useTranslation();
  if (error instanceof ApiError && error.status === 404) {
    return <NotFound label={notFoundLabel} />;
  }
  return <p className="error">{t("common.error")}</p>;
}
