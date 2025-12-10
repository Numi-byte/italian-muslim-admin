// src/App.tsx
import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/authContext";

import LoginScreen from "./components/LoginScreen";
import RamadanPage from "./pages/RamadanPage";
import IftarRequestsPage from "./pages/IftarRequestsPage";
import PrayerTimesPage from "./pages/PrayerTimesPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import PublicHomePage from "./pages/PublicHomePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MasjidsAdminPage from "./pages/MasjidsAdminPage";

// ⬇️ Jumu'ah page back
import JumuahTimesPage from "./pages/JumuahTimesPage";

// ⬇️ Legal pages
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

// -------------------------
// Types
// -------------------------

type AdminTab =
  | "masjids"
  | "ramadan"
  | "requests"
  | "prayers"
  | "jumuah"
  | "announcements"
  | "analytics";

type AdminRouteProps = {
  children: React.ReactElement;
};

type LocationState = {
  from?: string;
};

// -------------------------
// Private route wrapper for /admin
// -------------------------

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { loading, session, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="flex flex-col items-center gap-2 text-xs text-slate-300">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Checking admin session…</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="max-w-md text-center space-y-4 text-xs">
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="text-slate-400">
            Your account is not authorized to access the Ummah Way admin
            console. Only profiles with role{" "}
            <span className="font-mono text-emerald-300">super_admin</span> are
            allowed.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

// -------------------------
// Login route wrapper
// -------------------------

const LoginRoute: React.FC = () => {
  const { loading, session } = useAuth();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const from = state?.from ?? "/admin";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="flex flex-col items-center gap-2 text-xs text-slate-300">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Checking session…</span>
        </div>
      </div>
    );
  }

  if (session) {
    return <Navigate to={from} replace />;
  }

  return <LoginScreen />;
};

// -------------------------
// Admin layout (console)
// -------------------------

const AdminLayout: React.FC = () => {
  const { signOut, user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("masjids");

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-[0.25em] text-emerald-400 uppercase">
              Ummah Way
            </span>
            <span className="text-[11px] text-slate-400">Admin Console</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 text-sm">
          {/* Masjids directory / onboarding */}
          <button
            type="button"
            onClick={() => setTab("masjids")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              tab === "masjids"
                ? "bg-slate-800/90 text-emerald-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            }`}
          >
            Masjids
          </button>

          <button
            type="button"
            onClick={() => setTab("ramadan")}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between ${
              tab === "ramadan"
                ? "bg-slate-800/90 text-emerald-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            }`}
          >
            <span>Ramadan & Iftar</span>
            <span className="text-[10px] uppercase tracking-wide text-emerald-300/70">
              2026
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("requests")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              tab === "requests"
                ? "bg-slate-800/90 text-emerald-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            }`}
          >
            Iftar requests
          </button>

          <button
            type="button"
            onClick={() => setTab("prayers")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              tab === "prayers"
                ? "bg-slate-800/90 text-emerald-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            }`}
          >
            Daily prayer times
          </button>

          {/* Jumu'ah dedicated tab */}
          <button
            type="button"
            onClick={() => setTab("jumuah")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              tab === "jumuah"
                ? "bg-slate-800/90 text-emerald-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            }`}
          >
            Jumuʿah schedule
          </button>

          <button
            type="button"
            onClick={() => setTab("announcements")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              tab === "announcements"
                ? "bg-slate-800/90 text-emerald-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            }`}
          >
            Announcements
          </button>

          <div className="pt-3 border-t border-slate-800/70 mt-2 text-[10px] uppercase tracking-wide text-slate-500">
            Insights
          </div>

          <button
            type="button"
            onClick={() => setTab("analytics")}
            className={`mt-1 w-full text-left px-3 py-2 rounded-lg ${
              tab === "analytics"
                ? "bg-emerald-500/10 border border-emerald-400/60 text-emerald-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            }`}
          >
            User insights
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">
              {tab === "masjids" && "Masjid directory & onboarding"}
              {tab === "ramadan" && "Ramadan & Iftar Sponsorship 2026"}
              {tab === "requests" && "Iftar sponsorship requests"}
              {tab === "prayers" && "Daily prayer times"}
              {tab === "jumuah" && "Jumuʿah timings & Friday slots"}
              {tab === "announcements" && "Masjid announcements"}
              {tab === "analytics" && "Users & onboarding insights"}
            </h1>
            <p className="text-xs text-slate-400">
              {tab === "masjids" &&
                "Onboard new masjids, manage their profiles and control which ones are visible in the mobile app."}
              {tab === "ramadan" &&
                "Configure Ramadan calendar and booking window used by the mobile app."}
              {tab === "requests" &&
                "Review, approve or reject iftar sponsorship requests from the community."}
              {tab === "prayers" &&
                "Set official daily start and jamā‘ah times for each masjid and day."}
              {tab === "jumuah" &&
                "Manage Jumuʿah khutbah and jamā‘ah slots, languages and overflow timings."}
              {tab === "announcements" &&
                "Publish official announcements for each masjid: Jumuʿah, events, Ramadan and urgent alerts."}
              {tab === "analytics" &&
                "See who is using the app: masjid distribution, gender and age bands, and notification opt-in rates."}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="text-right">
              <div className="text-slate-200 font-medium">
                {user?.email ?? "admin"}
              </div>
              <div className="text-[10px] text-emerald-300">super_admin</div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6">
          {tab === "masjids" && <MasjidsAdminPage />}
          {tab === "ramadan" && <RamadanPage />}
          {tab === "requests" && <IftarRequestsPage />}
          {tab === "prayers" && <PrayerTimesPage />}
          {tab === "jumuah" && <JumuahTimesPage />}
          {tab === "announcements" && <AnnouncementsPage />}
          {tab === "analytics" && <AnalyticsPage />}
        </section>
      </main>
    </div>
  );
};

// -------------------------
// App root with routing
// -------------------------

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public presentation site */}
          <Route path="/" element={<PublicHomePage />} />

          {/* Legal pages */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Login page */}
          <Route path="/login" element={<LoginRoute />} />

          {/* Private admin console */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
