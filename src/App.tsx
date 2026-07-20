// src/App.tsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/authContext";
import {
  MosqueIcon,
  MoonIcon,
  InboxIcon,
  ClockIcon,
  CalendarIcon,
  MegaphoneIcon,
  TagIcon,
  ChartIcon,
  UserIcon,
  LifeBuoyIcon,
  MenuIcon,
  CloseIcon,
  LogoutIcon,
  ChevronRightIcon,
} from "./components/icons";

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
import AccountPage from "./pages/AccountPage";
import ContactPage, { ContactSupportPanel } from "./pages/ContactPage";
import TvPage from "./pages/TvPage";
import ListMasjidPage from "./pages/ListMasjidPage";

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
  | "sponsoredAds"
  | "account"
  | "contact";

type AdminRouteProps = {
  children: React.ReactElement;
};

type LocationState = {
  from?: string;
};

type TabMeta = {
  label: string;
  shortLabel: string;
  description: string;
  section: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

const ADMIN_TABS: Record<AdminTab, TabMeta> = {
  masjids: {
    label: "Masjids",
    shortLabel: "Masjids",
    section: "Manage",
    icon: MosqueIcon,
    description:
      "Onboard new masjids, manage their profiles and control mobile app visibility.",
  },
  ramadan: {
    label: "Ramadan & Iftar",
    shortLabel: "Ramadan",
    section: "Seasonal",
    icon: MoonIcon,
    description:
      "Configure Ramadan calendar and booking windows used by the mobile app.",
  },
  requests: {
    label: "Iftar requests",
    shortLabel: "Requests",
    section: "Seasonal",
    icon: InboxIcon,
    description:
      "Review, approve or reject iftar sponsorship requests from the community.",
  },
  prayers: {
    label: "Daily prayer times",
    shortLabel: "Prayers",
    section: "Timings",
    icon: ClockIcon,
    description:
      "Set official daily start and jamaah times for each masjid and day.",
  },
  jumuah: {
    label: "Jumuah schedule",
    shortLabel: "Jumuah",
    section: "Timings",
    icon: CalendarIcon,
    description:
      "Manage Friday khutbah and jamaah slots, languages and overflow timings.",
  },
  announcements: {
    label: "Announcements",
    shortLabel: "News",
    section: "Publish",
    icon: MegaphoneIcon,
    description:
      "Publish official announcements for each masjid: Friday, events, Ramadan and urgent alerts.",
  },
  sponsoredAds: {
    label: "Sponsored ads",
    shortLabel: "Ads",
    section: "Publish",
    icon: TagIcon,
    description: "Create and schedule sponsored cards for the Prayers page.",
  },
  analytics: {
    label: "User insights",
    shortLabel: "Insights",
    section: "Insights",
    icon: ChartIcon,
    description:
      "Track installations, active usage, retention, frequency and page time.",
  },
  account: {
    label: "Account & purchases",
    shortLabel: "Account",
    section: "Account",
    icon: UserIcon,
    description:
      "Check login access, subscription or lifetime purchase status and purchase history.",
  },
  contact: {
    label: "Contact support",
    shortLabel: "Support",
    section: "Account",
    icon: LifeBuoyIcon,
    description:
      "Send account, purchase and masjid timing questions directly to UmmahWay support.",
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
  "account",
  "contact",
];

const LIMITED_PRAYER_TABS: AdminTab[] = ["prayers", "account", "contact"];
const SELF_SERVICE_TABS: AdminTab[] = ["account", "contact"];

// -------------------------
// Private route wrapper for /admin
// -------------------------

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { loading, session } = useAuth();
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
    isAdmin ? "masjids" : isPrayerTimingEditor ? "prayers" : "account"
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const canUseFullAdmin = isAdmin;
  const availableTabs = canUseFullAdmin
    ? FULL_ADMIN_TABS
    : isPrayerTimingEditor
      ? LIMITED_PRAYER_TABS
      : SELF_SERVICE_TABS;
  const activeTab = availableTabs.includes(tab) ? tab : availableTabs[0];
  const activeMeta = ADMIN_TABS[activeTab];
  const roleLabel = isAdmin
    ? "Super admin"
    : isPrayerTimingEditor
      ? "Jamaah editor"
      : "Account holder";
  const sections = Array.from(
    new Set(availableTabs.map((item) => ADMIN_TABS[item].section))
  );

  // Close the mobile drawer whenever the active tab changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeTab]);

  // Prevent background scroll while the mobile drawer is open.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

  const initials = (user?.email ?? "admin").slice(0, 2).toUpperCase();

  // Shared navigation list, reused by the desktop sidebar and mobile drawer.
  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {sections.map((section) => (
        <div key={section} className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {section}
          </div>
          {availableTabs
            .filter((item) => ADMIN_TABS[item].section === section)
            .map((item) => {
              const meta = ADMIN_TABS[item];
              const Icon = meta.icon;
              const selected = item === activeTab;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setTab(item);
                    onNavigate?.();
                  }}
                  aria-current={selected ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "bg-emerald-50 font-semibold text-emerald-900 ring-1 ring-emerald-200"
                      : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                      selected
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700"
                    }`}
                  >
                    <Icon width={17} height={17} />
                  </span>
                  <span className="truncate">{meta.label}</span>
                </button>
              );
            })}
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25">
        <MosqueIcon width={20} height={20} />
      </span>
      <div className="leading-tight">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
          Ummah Way
        </div>
        <div className="text-base font-semibold text-slate-900">
          Admin Console
        </div>
      </div>
    </div>
  );

  const userCard = (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-900">
            {user?.email ?? "admin"}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            {roleLabel}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        <LogoutIcon width={15} height={15} />
        Logout
      </button>
    </div>
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
    if (activeTab === "account") {
      return <AccountPage onContactSupport={() => setTab("contact")} />;
    }
    if (activeTab === "contact") {
      return <ContactSupportPanel embedded />;
    }
    return <PrayerTimesPage />;
  };

  const ActiveIcon = activeMeta.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-100 px-5 py-5">{brand}</div>
        {renderNav()}
        <div className="border-t border-slate-100 p-4">{userCard}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              {brand}
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            {renderNav()}
            <div className="border-t border-slate-100 p-4">{userCard}</div>
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <MenuIcon width={20} height={20} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              {activeMeta.section}
            </div>
            <div className="truncate text-sm font-semibold text-slate-900">
              {activeMeta.label}
            </div>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
            {initials}
          </span>
        </header>

        {/* Desktop header */}
        <header className="sticky top-0 z-20 hidden border-b border-slate-200 bg-white/90 backdrop-blur lg:block">
          <div className="flex items-center justify-between gap-6 px-8 py-5">
            <div className="min-w-0">
              <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <span>Console</span>
                <ChevronRightIcon width={13} height={13} />
                <span className="text-slate-500">{activeMeta.section}</span>
              </nav>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ActiveIcon width={22} height={22} />
                </span>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-slate-900">
                    {activeMeta.label}
                  </h1>
                  <p className="max-w-3xl truncate text-sm text-slate-500">
                    {activeMeta.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-5 lg:px-8 lg:py-6">
          {/* Mobile page description */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 lg:hidden">
            <p className="text-sm leading-6 text-slate-600">
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
          <Route path="/masjids" element={<PublicHomePage />} />
          <Route path="/masjids/:slug" element={<MasjidPublicPage />} />
          <Route path="/list-your-masjid" element={<ListMasjidPage />} />
          <Route path="/tv" element={<TvPage />} />
          <Route path="/sponsor" element={<BusinessSponsorshipPage />} />
          <Route path="/contact" element={<ContactPage />} />

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
