import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/authEndpoints";
import { ApiError } from "../api/client";
import { Panel } from "../components/Panel";
import { Loading } from "../components/StateViews";

type State = "verifying" | "success" | "expired" | "invalid";

export default function VerifyEmailPage() {
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
        <h1 className="title">Email verification</h1>
      </div>
      <Panel>
        {state === "verifying" && <Loading />}
        {state === "success" && (
          <p className="form-note" role="status">
            Email verified. <Link to="/account">Go to your account</Link>
          </p>
        )}
        {state === "expired" && (
          <p className="form-error" role="alert">
            This link has expired. Sign in and resend the verification email from your account.
          </p>
        )}
        {state === "invalid" && (
          <p className="form-error" role="alert">This link is invalid or already used.</p>
        )}
      </Panel>
    </section>
  );
}
