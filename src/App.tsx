import { Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import { HomeOrLegacyRedirect } from "./components/LegacyPlayerRedirect";
import MatchPage from "./pages/MatchPage";
import PlayerPage from "./pages/PlayerPage";

export default function App() {
  return (
    <>
      <Nav />
      <main className="card">
        <Routes>
          <Route path="/" element={<HomeOrLegacyRedirect />} />
          <Route path="/players/:playerId" element={<PlayerPage />} />
          <Route path="/matches/:matchId" element={<MatchPage />} />
        </Routes>
      </main>
    </>
  );
}
