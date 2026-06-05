import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/authEndpoints";
import { ApiError } from "../api/client";
import { Panel } from "../components/Panel";
import { Loading } from "../components/StateViews";

type State = "verifying" | "success" | "expired" | "invalid";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("verifying");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      if (!token) {
        setState("invalid");
        return;
      }
      try {
        await verifyEmail(token);
        setState("success");
      } catch (err) {
        setState(err instanceof ApiError && err.code === "token_expired" ? "expired" : "invalid");
      }
    }
    void run();
  }, [token]);

  return (
    <section className="stack auth-card">
      <div className="page-head">
        <h1 className="title">{t("auth.verifyTitle")}</h1>
      </div>
      <Panel>
        {state === "verifying" && <Loading />}
        {state === "success" && (
          <p className="form-note" role="status">
            {t("auth.emailVerified")} <Link to="/account">{t("auth.verifyGoAccount")}</Link>
          </p>
        )}
        {state === "expired" && (
          <p className="form-error" role="alert">
            {t("auth.verifyExpired")}
          </p>
        )}
        {state === "invalid" && (
          <p className="form-error" role="alert">{t("auth.verifyInvalid")}</p>
        )}
      </Panel>
    </section>
  );
}
