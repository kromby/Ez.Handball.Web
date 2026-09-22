import { BallAvatar } from "./BallAvatar";

/** A league member's favorite-club logo, or the PIVOT ball when there is no club or no logo.
 *  The ball needs <BallDefs/> mounted on the page. */
export function MemberCrest({ logoUrl, clubName }: { logoUrl: string | null | undefined; clubName?: string }) {
  if (logoUrl) return <img className="club-logo-sm" src={logoUrl} alt={clubName ?? ""} />;
  return <BallAvatar size={22} />;
}
