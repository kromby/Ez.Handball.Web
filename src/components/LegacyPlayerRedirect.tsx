import { Navigate, useSearchParams } from "react-router-dom";
import PlayerHubPage from "../pages/PlayerHubPage";

export function HomeOrLegacyRedirect() {
  const [params] = useSearchParams();
  const legacyPlayerId = params.get("playerId");
  if (legacyPlayerId) {
    return <Navigate to={`/players/${encodeURIComponent(legacyPlayerId)}`} replace />;
  }
  return <PlayerHubPage />;
}
