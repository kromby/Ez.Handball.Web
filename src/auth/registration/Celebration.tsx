import type { Club } from "../../api/types";
import { clubColor } from "./clubColor";
import { ClubCrest } from "./ClubCrest";
import { Icon } from "./Icon";

/** The "you're in" moment: the club crest with a pencil burst + MEMBER stamp. */
export function Celebration({
  displayName,
  club,
  onEnter,
}: {
  displayName: string;
  club: Club | null;
  onEnter: () => void;
}) {
  const accent = club ? clubColor(club.clubId) : "var(--amber-deep)";
  const firstName = displayName.trim() ? displayName.trim().split(/\s+/)[0] : "manager";

  return (
    <div className="reg-celebrate reg-page">
      <div className="reg-celebrate-mark">
        <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true" className="reg-celebrate-burst">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const r1 = 62;
            const r2 = 84 + (i % 3) * 9;
            return (
              <line
                key={i}
                x1={100 + Math.cos(angle) * r1}
                y1={100 + Math.sin(angle) * r1}
                x2={100 + Math.cos(angle) * r2}
                y2={100 + Math.sin(angle) * r2}
                stroke={i % 2 ? "var(--amber)" : "var(--ink)"}
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#pencil)"
                className="reg-burst"
                style={{ animationDelay: `${i * 30}ms` }}
              />
            );
          })}
        </svg>
        <div className="reg-pop" style={{ position: "relative" }}>
          {club ? (
            <ClubCrest club={club} size={96} />
          ) : (
            <img src="/assets/ball.png" alt="" width={92} height={92} style={{ display: "block" }} />
          )}
          <div className="reg-stamp reg-celebrate-stamp" style={{ border: `2.5px solid ${accent}`, color: accent }}>
            MEMBER
          </div>
        </div>
      </div>

      <div className="scribble" style={{ fontSize: 21, color: "var(--amber-deep)", marginBottom: 4 }}>
        welcome to the back court
      </div>
      <h2>You&rsquo;re in, {firstName}.</h2>
      <p className="reg-celebrate-lede">
        {club ? (
          <>
            Your notebook&rsquo;s set up and <b style={{ color: "var(--ink)" }}>{club.name}</b> is pinned to the cover. Dive into the
            stats.
          </>
        ) : (
          <>Your account&rsquo;s ready. Dive into the league&rsquo;s stats.</>
        )}
      </p>
      <div className="reg-celebrate-actions">
        <button className="btn btn--amber" onClick={onEnter}>
          Explore the stats <Icon name="arrow" size={17} sketch={false} />
        </button>
      </div>
    </div>
  );
}
