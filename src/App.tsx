import { Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import { SketchBox } from "./components/SketchBox";
import { HomeOrLegacyRedirect } from "./components/LegacyPlayerRedirect";
import MatchPage from "./pages/MatchPage";
import PlayerPage from "./pages/PlayerPage";

export default function App() {
  return (
    <div className="app-shell">
      <Nav />
      <SketchBox as="main" tone="paper" radius={18} className="card" pad="clamp(20px, 4vw, 38px)">
        <Routes>
          <Route path="/" element={<HomeOrLegacyRedirect />} />
          <Route path="/players/:playerId" element={<PlayerPage />} />
          <Route path="/matches/:matchId" element={<MatchPage />} />
        </Routes>
      </SketchBox>
    </div>
  );
}
