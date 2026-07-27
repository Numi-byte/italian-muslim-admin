import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import CountrySelector from "./CountrySelector";
import type { CountryCode } from "../lib/countryConfig";
import { TV_APP_URL } from "../lib/publicLinks";
import { PUBLIC_SITE_LINKS } from "../lib/siteStructure";

type NavIconName =
  | "home"
  | "pin"
  | "screen"
  | "tag"
  | "briefcase"
  | "mail"
  | "shield"
  | "doc"
  | "menu"
  | "close"
  | "arrow";

const NavIcon: React.FC<{ name: NavIconName; className?: string }> = ({
  name,
  className = "h-5 w-5",
}) => {
  const paths: Record<NavIconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9" />
        <path d="M9 21v-6a3 3 0 0 1 6 0v6" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    screen: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </>
    ),
    tag: (
      <>
        <path d="M4 12.5 11.5 5H19a1 1 0 0 1 1 1v7.5L12.5 21a1.5 1.5 0 0 1-2.1 0l-6.4-6.4a1.5 1.5 0 0 1 0-2.1Z" />
        <circle cx="15.5" cy="8.5" r="1.3" />
      </>
    ),
    briefcase: (
      <>
        <path d="M9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path d="M4 12h16M10 12v2h4v-2" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    doc: (
      <>
        <path d="M7 3h6l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M13 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
};

const NAV_ICONS: Record<string, NavIconName> = {
  "/masjids": "home",
  "/list-your-masjid": "pin",
  "/tv": "screen",
  "/sponsor": "tag",
  "/careers": "briefcase",
  "/contact": "mail",
};

type PublicNavProps = {
  /** Small caption under the logo. */
  tagline?: string;
  /** Fixed, scroll-aware header (home page). Default: sticky. */
  fixedHeader?: boolean;
  /** Show the floating bottom bar on mobile. */
  showBottomBar?: boolean;
  /** Show the country selector (desktop header + mobile menu). */
  countryCode?: CountryCode;
};

const PublicNav: React.FC<PublicNavProps> = ({
  tagline,
  fixedHeader = false,
  showBottomBar = false,
  countryCode,
}) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!fixedHeader) return;
    const updateHeader = () => setIsScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, [fixedHeader]);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll and close on Escape while the drawer is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const headerPosition = fixedHeader
    ? `fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-[#e7e1d3] bg-[#f7f4ec]/95 shadow-sm backdrop-blur"
          : "bg-[#f7f4ec]/75 backdrop-blur"
      }`
    : "sticky top-0 z-50 border-b border-[#e7e1d3] bg-[#f7f4ec]/95 backdrop-blur";

  return (
    <>
      <header className={headerPosition}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="UmmahWay home">
            <img src="/icon.png" alt="" className="h-10 w-10 rounded-lg shadow-sm" />
            <div>
              <span className="block font-display text-xl font-semibold leading-tight text-[#0a3d30]">
                UmmahWay
              </span>
              {tagline && (
                <span className="hidden text-[10px] font-medium uppercase text-[#9a8c68] sm:block">
                  {tagline}
                </span>
              )}
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#4a5852] md:flex">
            {PUBLIC_SITE_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={
                  isActive(link.path)
                    ? "font-semibold text-[#0f5c46]"
                    : "hover:text-[#0f5c46]"
                }
              >
                {link.navLabel}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {countryCode && (
              <CountrySelector
                selectedCode={countryCode}
                className="hidden text-[#4a5852] lg:inline-flex"
              />
            )}
            <Link
              to="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#4a5852] hover:bg-white md:inline-flex"
            >
              Admin
            </Link>
            <a
              href={TV_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-lg bg-[#0f5c46] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0a3d30] sm:inline-flex"
            >
              <NavIcon name="screen" className="h-4 w-4" />
              Display
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8cfb8] bg-white text-[#0a3d30] shadow-sm transition hover:border-[#0f5c46]/40 md:hidden"
            >
              <NavIcon name="menu" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-[#0a3d30]/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-[#f7f4ec] shadow-2xl shadow-black/30">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#e7e1d3] px-4">
              <div className="flex items-center gap-3">
                <img src="/icon.png" alt="" className="h-9 w-9 rounded-lg" />
                <span className="font-display text-lg font-semibold text-[#0a3d30]">
                  UmmahWay
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8cfb8] bg-white text-[#0a3d30] hover:border-[#0f5c46]/40"
              >
                <NavIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-5">
              <p className="px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a8c68]">
                Explore
              </p>
              <ul className="mt-3 space-y-1.5">
                {PUBLIC_SITE_LINKS.map((link) => {
                  const active = isActive(link.path);
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3.5 rounded-2xl border p-3.5 transition ${
                          active
                            ? "border-[#0f5c46]/30 bg-white shadow-sm"
                            : "border-transparent hover:border-[#d8cfb8] hover:bg-white"
                        }`}
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            active
                              ? "bg-[#0f5c46] text-white"
                              : "bg-white text-[#0f5c46] ring-1 ring-[#e7e1d3]"
                          }`}
                        >
                          <NavIcon
                            name={NAV_ICONS[link.path] ?? "arrow"}
                            className="h-5 w-5"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#1c2b26]">
                            {link.navLabel}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[#6b7a74]">
                            {link.description}
                          </span>
                        </span>
                        <NavIcon
                          name="arrow"
                          className="ml-auto h-4 w-4 shrink-0 text-[#9a8c68]"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-6 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a8c68]">
                More
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                <li>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl border border-[#e7e1d3] bg-white px-3.5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
                  >
                    <NavIcon name="shield" className="h-4 w-4 text-[#0f5c46]" />
                    Admin
                  </Link>
                </li>
                <li>
                  <a
                    href={TV_APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-[#e7e1d3] bg-white px-3.5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
                  >
                    <NavIcon name="screen" className="h-4 w-4 text-[#0f5c46]" />
                    TV Display
                  </a>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl border border-[#e7e1d3] bg-white px-3.5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
                  >
                    <NavIcon name="doc" className="h-4 w-4 text-[#0f5c46]" />
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl border border-[#e7e1d3] bg-white px-3.5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
                  >
                    <NavIcon name="doc" className="h-4 w-4 text-[#0f5c46]" />
                    Terms
                  </Link>
                </li>
              </ul>

              {countryCode && (
                <div className="mt-6 rounded-2xl border border-[#e7e1d3] bg-white p-4">
                  <CountrySelector
                    selectedCode={countryCode}
                    className="w-full justify-between text-[#4a5852]"
                  />
                </div>
              )}
            </nav>

            <div className="shrink-0 border-t border-[#e7e1d3] px-4 py-4 text-xs text-[#9a8c68]">
              &copy; {new Date().getFullYear()} UmmahWay
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom bar */}
      {showBottomBar && (
        <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-[#0f5c46]/40 bg-[#0a3d30]/95 px-2 py-2 text-white shadow-2xl shadow-black/30 backdrop-blur md:hidden">
          <div className="grid grid-cols-4 text-center text-[11px] font-medium text-white/70">
            {[
              { href: "/masjids", label: "Masjids", icon: "home" as const },
              { href: "/list-your-masjid", label: "List", icon: "pin" as const },
              { href: "/tv", label: "TV", icon: "screen" as const },
            ].map((item) => (
              <Link key={item.label} to={item.href} className="group py-1">
                <span className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/70 group-hover:border-[#e6cf9a] group-hover:text-[#e6cf9a]">
                  <NavIcon name={item.icon} className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="group py-1"
            >
              <span className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/70 group-hover:border-[#e6cf9a] group-hover:text-[#e6cf9a]">
                <NavIcon name="menu" className="h-4 w-4" />
              </span>
              Menu
            </button>
          </div>
        </nav>
      )}
    </>
  );
};

export default PublicNav;
