import type { ReactNode } from "react";
import { Panel } from "../components/Panel";

/** The shared auth-screen shell: a titled page-head over a single sketch Panel. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="stack auth-card">
      <div className="page-head">
        <h1 className="title">{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      <Panel>{children}</Panel>
    </section>
  );
}
