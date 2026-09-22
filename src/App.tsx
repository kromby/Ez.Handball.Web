import { Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import { useLanguageSync } from "./i18n/useLanguage";
import { HomeOrLegacyRedirect } from "./components/LegacyPlayerRedirect";
import { AdminRoute, ProtectedRoute } from "./auth/ProtectedRoute";
import MatchPage from "./pages/MatchPage";
import PlayerPage from "./pages/PlayerPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import ShortlistPage from "./pages/ShortlistPage";
import SquadPage from "./pages/SquadPage";
import PlayerHubPage from "./pages/PlayerHubPage";
import LeaguesPage from "./pages/LeaguesPage";
import LeaguePage from "./pages/LeaguePage";
import JoinPage from "./pages/JoinPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import GameweeksPage from "./pages/GameweeksPage";
import ClubPage from "./pages/ClubPage";
import AdminTournamentsPage from "./pages/AdminTournamentsPage";
import AdminGamesPage from "./pages/AdminGamesPage";
import AdminGameDetailPage from "./pages/AdminGameDetailPage";
import AdminPlayersPage from "./pages/AdminPlayersPage";

export default function App() {
  useLanguageSync();
  return (
    <div className="app-shell">
      <Nav />
      <main className="page">
        <Routes>
          <Route path="/" element={<HomeOrLegacyRedirect />} />
          <Route path="/players" element={<PlayerHubPage />} />
          <Route path="/players/:playerId" element={<PlayerPage />} />
          <Route path="/clubs/:id" element={<ClubPage />} />
          <Route path="/matches/:matchId" element={<MatchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          {/* Verification emails link to /verify?token=…, per Auth:VerificationUrlTemplate on the API. */}
          <Route path="/verify" element={<VerifyEmailPage />} />
          <Route path="/gameweeks" element={<GameweeksPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/shortlist" element={<ShortlistPage />} />
            <Route path="/squad" element={<SquadPage />} />
            <Route path="/leagues" element={<LeaguesPage />} />
            <Route path="/leagues/:id" element={<LeaguePage />} />
            <Route path="/invite/:token" element={<JoinPage />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin/tournaments" element={<AdminTournamentsPage />} />
            <Route path="/admin/games" element={<AdminGamesPage />} />
            <Route path="/admin/games/:tournamentId" element={<AdminGameDetailPage />} />
            <Route path="/admin/players" element={<AdminPlayersPage />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
