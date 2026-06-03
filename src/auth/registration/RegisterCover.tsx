import type { Club } from "../../api/types";
import { clubColor } from "./clubColor";
import { ClubCrest } from "./ClubCrest";
import { Icon } from "./Icon";

const STEPS: [string, string][] = [
  ["Your details", "name, email & password"],
  ["Your club", "pick who you support"],
];

function coverBackground(club: Club | null): string {
  if (!club) return "linear-gradient(160deg, #322c22, var(--ink))";
  const tint = clubColor(club.clubId);
  return `linear-gradient(160deg, color-mix(in srgb, ${tint} 88%, #000), color-mix(in srgb, ${tint} 70%, #1a1712))`;
}

/**
 * The notebook "cover": a brand rail on desktop, a top banner on mobile. It
 * retints to the chosen club's colour and previews its crest — the signature
 * moment of this flow.
 */
export function RegisterCover({ club, step, done }: { club: Club | null; step: number; done: boolean }) {
  return (
    <div className="reg-cover" style={{ background: coverBackground(club) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <span
          style={{
            background: "var(--paper-2)",
            borderRadius: 9,
            padding: 5,
            display: "inline-flex",
            flex: "none",
            boxShadow: "0 1px 0 #fff8 inset, 0 2px 6px -2px rgba(40,36,29,.35)",
          }}
        >
          <img src="/assets/logo.png" alt="Ez.Handball" width={30} height={30} style={{ display: "block", objectFit: "contain" }} />
        </span>
        <span style={{ fontFamily: "var(--serif, Spectral, serif)", fontWeight: 800, fontSize: 18, color: "#fbf4e2", letterSpacing: ".02em" }}>
          Ez.Handball
        </span>
      </div>

      <div className="scribble reg-cover-scribble">match weekend awaits —</div>
      <h2>
        Follow every match,
        <br />
        player and club.
      </h2>

      <div className="reg-cover-preview">
        {club ? (
          <div className="reg-cover-club reg-pop" key={club.clubId}>
            <ClubCrest club={club} size={64} />
            <div>
              <div className="reg-cover-club-name">{club.name}</div>
            </div>
          </div>
        ) : (
          <div className="reg-cover-placeholder">
            <img src="/assets/ball.png" alt="" width={52} height={52} style={{ display: "block" }} />
            <div className="scribble" style={{ fontSize: 17, color: "#f3ead2cc", maxWidth: 150 }}>
              your club&rsquo;s crest lands here ↘
            </div>
          </div>
        )}
      </div>

      <div className="reg-steps">
        {STEPS.map(([title, sub], index) => {
          const active = index === step && !done;
          const finished = index < step || done;
          return (
            <div key={title} className={`reg-step${active ? " is-active" : ""}${finished ? " is-done" : ""}`}>
              <div className="reg-step-num">{finished ? <Icon name="check" size={14} sketch={false} /> : index + 1}</div>
              <div>
                <div className="reg-step-title">{title}</div>
                <div className="reg-step-sub">{sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
