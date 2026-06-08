import { Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import { useLanguageSync } from "./i18n/useLanguage";
import { HomeOrLegacyRedirect } from "./components/LegacyPlayerRedirect";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import MatchPage from "./pages/MatchPage";
import PlayerPage from "./pages/PlayerPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import ShortlistPage from "./pages/ShortlistPage";
import SquadPage from "./pages/SquadPage";
import MarketPage from "./pages/MarketPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

export default function App() {
  useLanguageSync();
  return (
    <div className="app-shell">
      <Nav />
      <main className="page">
        <Routes>
          <Route path="/" element={<HomeOrLegacyRedirect />} />
          <Route path="/players/:playerId" element={<PlayerPage />} />
          <Route path="/matches/:matchId" element={<MatchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/shortlist" element={<ShortlistPage />} />
            <Route path="/squad" element={<SquadPage />} />
            <Route path="/market" element={<MarketPage />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
