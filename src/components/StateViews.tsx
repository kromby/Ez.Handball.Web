import { ApiError } from "../api/client";

export function Loading() {
  return <p className="status">Loading…</p>;
}

export function NotFound({ label }: { label: string }) {
  return <p className="status">{label}</p>;
}

export function ErrorView({ error, notFoundLabel }: { error: unknown; notFoundLabel: string }) {
  if (error instanceof ApiError && error.status === 404) {
    return <NotFound label={notFoundLabel} />;
  }
  return <p className="error">Something went wrong. Please try again.</p>;
}
