import { Navigate, useSearchParams } from "react-router-dom";
import LeaderboardPage from "../pages/LeaderboardPage";

export function HomeOrLegacyRedirect() {
  const [params] = useSearchParams();
  const legacyPlayerId = params.get("playerId");
  if (legacyPlayerId) {
    return <Navigate to={`/players/${encodeURIComponent(legacyPlayerId)}`} replace />;
  }
  return <LeaderboardPage />;
}
