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
import MasjidPublicPage from "./pages/MasjidPublicPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MasjidsAdminPage from "./pages/MasjidsAdminPage";
import BusinessSponsorshipPage from "./pages/BusinessSponsorshipPage";
import SponsoredAdsPage from "./pages/SponsoredAdsPage";

import ResetPasswordPage from "./pages/ResetPasswordPage";

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
  | "analytics"
  | "sponsoredAds";

type AdminRouteProps = {
  children: React.ReactElement;
};

type LocationState = {
  from?: string;
};

const ADMIN_TABS: Record<
  AdminTab,
  { label: string; shortLabel: string; description: string; section: string }
> = {
  masjids: {
    label: "Masjids",
    shortLabel: "Masjids",
    section: "Manage",
    description:
      "Onboard new masjids, manage their profiles and control mobile app visibility.",
  },
  ramadan: {
    label: "Ramadan & Iftar",
    shortLabel: "Ramadan",
    section: "Seasonal",
    description:
      "Configure Ramadan calendar and booking windows used by the mobile app.",
  },
  requests: {
    label: "Iftar requests",
    shortLabel: "Requests",
    section: "Seasonal",
    description:
      "Review, approve or reject iftar sponsorship requests from the community.",
  },
  prayers: {
    label: "Daily prayer times",
    shortLabel: "Prayers",
    section: "Timings",
    description:
      "Set official daily start and jamaah times for each masjid and day.",
  },
  jumuah: {
    label: "Jumuah schedule",
    shortLabel: "Jumuah",
    section: "Timings",
    description:
      "Manage Friday khutbah and jamaah slots, languages and overflow timings.",
  },
  announcements: {
    label: "Announcements",
    shortLabel: "News",
    section: "Publish",
    description:
      "Publish official announcements for each masjid: Friday, events, Ramadan and urgent alerts.",
  },
  sponsoredAds: {
    label: "Sponsored ads",
    shortLabel: "Ads",
    section: "Publish",
    description: "Create and schedule sponsored cards for the Prayers page.",
  },
  analytics: {
    label: "User insights",
    shortLabel: "Insights",
    section: "Insights",
    description:
      "Track installations, active usage, retention, frequency and page time.",
  },
};

const FULL_ADMIN_TABS: AdminTab[] = [
  "masjids",
  "prayers",
  "jumuah",
  "announcements",
  "ramadan",
  "requests",
  "sponsoredAds",
  "analytics",
];

const LIMITED_PRAYER_TABS: AdminTab[] = ["prayers"];

// -------------------------
// Private route wrapper for /admin
// -------------------------

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { loading, session, isAdmin, isPrayerTimingEditor, signOut } =
    useAuth();
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

  if (!isAdmin && !isPrayerTimingEditor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="max-w-md text-center space-y-4 text-xs">
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="text-slate-400">
            Your account is not authorized to access the Ummah Way admin
            console.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            Logout
          </button>
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
  const { signOut, user, isAdmin, isPrayerTimingEditor } = useAuth();
  const [tab, setTab] = useState<AdminTab>(() =>
    isPrayerTimingEditor && !isAdmin ? "prayers" : "masjids"
  );
  const canUseFullAdmin = isAdmin;
  const availableTabs = canUseFullAdmin ? FULL_ADMIN_TABS : LIMITED_PRAYER_TABS;
  const activeTab = availableTabs.includes(tab) ? tab : availableTabs[0];
  const activeMeta = ADMIN_TABS[activeTab];
  const roleLabel = isAdmin ? "Super admin" : "Jamaah editor";
  const sections = Array.from(
    new Set(availableTabs.map((item) => ADMIN_TABS[item].section))
  );

  const renderPage = () => {
    if (activeTab === "masjids" && canUseFullAdmin) return <MasjidsAdminPage />;
    if (activeTab === "ramadan" && canUseFullAdmin) return <RamadanPage />;
    if (activeTab === "requests" && canUseFullAdmin) return <IftarRequestsPage />;
    if (activeTab === "prayers") return <PrayerTimesPage />;
    if (activeTab === "jumuah" && canUseFullAdmin) return <JumuahTimesPage />;
    if (activeTab === "announcements" && canUseFullAdmin) {
      return <AnnouncementsPage />;
    }
    if (activeTab === "analytics" && canUseFullAdmin) return <AnalyticsPage />;
    if (activeTab === "sponsoredAds" && canUseFullAdmin) {
      return <SponsoredAdsPage />;
    }
    return <PrayerTimesPage />;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 lg:flex">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">
            Ummah Way
          </div>
          <div className="mt-1 text-xl font-semibold">Admin Console</div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {sections.map((section) => (
            <div key={section} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {section}
              </div>
              {availableTabs
                .filter((item) => ADMIN_TABS[item].section === section)
                .map((item) => {
                  const meta = ADMIN_TABS[item];
                  const selected = item === activeTab;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTab(item)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        selected
                          ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      <span className="block font-medium">{meta.label}</span>
                      <span
                        className={`mt-0.5 block text-[11px] ${
                          selected ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {meta.section}
                      </span>
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="truncate text-sm font-medium text-slate-900">
              {user?.email ?? "admin"}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              {roleLabel}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:hidden">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                Ummah Way
              </div>
              <div className="truncate text-base font-semibold">
                {activeMeta.label}
              </div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Logout
            </button>
          </div>

          <div className="overflow-x-auto px-3 pb-3 lg:hidden">
            <div className="flex min-w-max gap-2">
              {availableTabs.map((item) => {
                const meta = ADMIN_TABS[item];
                const selected = item === activeTab;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                      selected
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {meta.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden items-center justify-between gap-6 px-8 py-5 lg:flex">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {activeMeta.section}
              </div>
              <h1 className="mt-1 text-2xl font-semibold">{activeMeta.label}</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                {activeMeta.description}
              </p>
            </div>
            <div className="min-w-52 text-right">
              <div className="truncate text-sm font-medium text-slate-900">
                {user?.email ?? "admin"}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {roleLabel}
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-5 lg:px-8 lg:py-6">
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 lg:hidden">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {activeMeta.section}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {activeMeta.description}
            </p>
          </div>
          {renderPage()}
        </section>
      </main>
    </div>
  );
};

// App root with routing
// -------------------------

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public presentation site */}
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/masjids/:slug" element={<MasjidPublicPage />} />
          <Route path="/sponsor" element={<BusinessSponsorshipPage />} />

          {/* Legal pages */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Login page */}
          <Route path="/login" element={<LoginRoute />} />

          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
