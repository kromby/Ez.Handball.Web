// src/components/ClubLink.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { clubPath } from "../lib/clubPath";

interface ClubLinkProps {
  clubId: string | null | undefined;
  name?: string | null;
  fallback?: string;
  className?: string;
  children?: ReactNode;
}

/** Renders a club identity as a link to its club page when a clubId is known,
    and as plain text otherwise. Pass `children` (e.g. a logo + name) to make a
    richer link target; otherwise `name` (or `fallback`) is shown. */
export function ClubLink({ clubId, name, fallback = "—", className, children }: ClubLinkProps) {
  const content = children ?? (name && name.length > 0 ? name : fallback);
  if (clubId && clubId.length > 0) {
    const cls = ["club-link", className].filter(Boolean).join(" ");
    return (
      <Link to={clubPath(clubId)} className={cls}>
        {content}
      </Link>
    );
  }
  return <span className={className}>{content}</span>;
}
