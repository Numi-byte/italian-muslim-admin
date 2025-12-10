// src/pages/PublicHomePage.tsx
import React from "react";
import { Link } from "react-router-dom";

const PublicHomePage: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: logo / brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-400/60 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.5)]">
              <span className="text-xs font-bold tracking-widest text-emerald-300">
                IM
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-[0.22em] uppercase text-emerald-300">
                Ummah Way
              </span>
              <span className="text-[11px] text-slate-400">
                South Tyrol &amp; Trentino
              </span>
            </div>
          </Link>

          {/* Center: simple nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-slate-300">
            <a href="#how-it-works" className="hover:text-emerald-300">
              How it works
            </a>
            <a href="#for-worshippers" className="hover:text-emerald-300">
              For worshippers
            </a>
            <a href="#for-masjids" className="hover:text-emerald-300">
              For mosques &amp; boards
            </a>
          </nav>

          {/* Right: Admin login */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] text-slate-500">
              Private admin area
            </span>
            <Link
              to="/login"
              className="rounded-full border border-emerald-400/70 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20"
            >
              Admin login
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-900 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 grid gap-10 lg:grid-cols-2 items-center">
            {/* Hero copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                <span className="text-[11px] font-medium text-emerald-200">
                  Built for South Tyrol &amp; Trentino
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-50 tracking-tight">
                One{" "}
                <span className="text-emerald-300">trusted source</span> for
                prayer times, Jumuʿah &amp; announcements from your local
                masjid.
              </h1>

              <p className="mt-4 text-sm text-slate-300 max-w-xl">
                Ummah Way connects worshippers with their masjid&apos;s
                official timetable: daily prayers, Jumuʿah slots, events and
                Ramadan iftar – all published directly by the masjid admins.
              </p>

              <div className="mt-5 flex flex-wrap gap-3 text-xs items-center">
                <button
                  type="button"
                  className="rounded-lg bg-emerald-500 text-emerald-950 font-semibold px-4 py-2 shadow-lg shadow-emerald-500/25 cursor-default"
                >
                  Coming soon to App Store &amp; Play Store
                </button>
                <a
                  href="#how-it-works"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 hover:bg-slate-800"
                >
                  See how it works
                </a>
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-200 font-medium">
                    Verified timings
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span className="text-slate-200 font-medium">
                    Multilingual interface
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span className="text-slate-200 font-medium">
                    No public chat, no spam
                  </span>
                </div>
              </div>
            </div>

            {/* Hero phone-style preview */}
            <div className="lg:pl-6">
              <div className="relative mx-auto max-w-xs sm:max-w-sm">
                <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-emerald-500/40 via-sky-500/30 to-violet-500/30 opacity-60 blur-3" />
                <div className="relative rounded-[2rem] border border-slate-700/80 bg-slate-950/95 px-4 py-5 shadow-[0_22px_70px_rgba(15,23,42,0.95)] overflow-hidden">
                  {/* Phone notch-ish bar */}
                  <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-700/60" />

                  {/* Top status row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Today · Bolzano</span>
                    <span className="inline-flex items-center gap-1 text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Live timetable
                    </span>
                  </div>

                  {/* Masjid pill */}
                  <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-[11px] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-slate-300 font-medium">
                        Masjid al-Nur
                      </span>
                      <span className="text-slate-500">
                        Saved as your main masjid
                      </span>
                    </div>
                    <span className="ml-3 rounded-full bg-slate-800 px-3 py-1 text-[10px] text-slate-200">
                      Bolzano · Via Trento
                    </span>
                  </div>

                  {/* Prayers grid */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                    {[
                      { name: "Fajr", start: "05:32", jamaat: "05:50" },
                      { name: "Dhuhr", start: "12:25", jamaat: "13:00" },
                      { name: "Asr", start: "15:40", jamaat: "16:00" },
                      { name: "Maghrib", start: "17:12", jamaat: "17:15" },
                      { name: "Isha", start: "18:30", jamaat: "19:00" },
                      { name: "Jumuʿah", start: "13:30", jamaat: "14:00" },
                    ].map((p) => (
                      <div
                        key={p.name}
                        className="rounded-xl border border-slate-800 bg-slate-900/75 px-3 py-2.5 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-100 font-medium">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Today
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex flex-col">
                            <span className="text-slate-500 text-[10px]">
                              Start
                            </span>
                            <span className="text-slate-100 font-semibold">
                              {p.start}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-slate-500 text-[10px]">
                              Jamāʿah
                            </span>
                            <span className="text-slate-100 font-semibold">
                              {p.jamaat}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Announcements preview chip */}
                  <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-[10px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 font-medium">
                        Announcement
                      </span>
                      <span className="rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-0.5 text-[9px] text-amber-200">
                        Jumuʿah
                      </span>
                    </div>
                    <div className="text-slate-100">
                      Extra khutbah in German · Fri 14:30
                    </div>
                  </div>

                  {/* Tab bar preview */}
                  <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/90 px-3 py-2 flex items-center justify-between text-[10px]">
                    {[
                      { key: "home", label: "Home", active: true },
                      { key: "prayers", label: "Prayers", active: false },
                      { key: "ann", label: "Announcements", active: false },
                      { key: "iftar", label: "Iftar", active: false },
                      { key: "settings", label: "Settings", active: false },
                    ].map((tab) => (
                      <div
                        key={tab.key}
                        className={`flex flex-col items-center gap-0.5 ${
                          tab.active ? "text-emerald-300" : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-4 w-4 rounded-full ${
                            tab.active
                              ? "bg-emerald-500/90"
                              : "bg-slate-700/80"
                          }`}
                        />
                        <span className="text-[9px]">{tab.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Disclaimer */}
                  <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-[10px] text-emerald-100">
                    Demo preview only. The real app fetches live timings and
                    announcements from the masjid&apos;s admin console.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-b border-slate-900 bg-slate-950"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <h2 className="text-base font-semibold text-slate-100">
              How Ummah Way works
            </h2>
            <p className="mt-2 text-xs text-slate-400 max-w-2xl">
              The app is intentionally simple: one side is for the community,
              the other is for mosque admins. No public chat, no viral feed –
              just verified information from your masjid.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wide">
                  1. Admin-only publishing
                </div>
                <p className="mt-2 text-slate-300">
                  Each masjid has a private admin login. Only approved people
                  can update prayer times, Jumuʿah details and announcements.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wide">
                  2. One app for worshippers
                </div>
                <p className="mt-2 text-slate-300">
                  Worshippers select their main masjid once. The app then shows
                  its daily timetable, Jumuʿah slots, Ramadan info and news.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wide">
                  3. Local &amp; multilingual
                </div>
                <p className="mt-2 text-slate-300">
                  Ummah Way focuses on South Tyrol &amp; Trentino, with
                  support for multiple languages used in the community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* For worshippers */}
        <section
          id="for-worshippers"
          className="border-b border-slate-900 bg-slate-950/95"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 grid gap-8 md:grid-cols-2 items-start">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                For worshippers &amp; families
              </h2>
              <p className="mt-2 text-xs text-slate-400 max-w-md">
                No more screenshots, forwarded messages or confusion. Open the
                app and see exactly what your masjid has published – in the
                language you understand.
              </p>

              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li>• Daily prayer times with start and Jamāʿah per masjid</li>
                <li>• Jumuʿah details: khutbah times, extra slots, languages</li>
                <li>• Ramadan calendar, iftar sponsorship and special nights</li>
                <li>• Announcements for events, classes and community news</li>
                <li>• Built with privacy in mind – no public chat or comments</li>
              </ul>
            </div>

            {/* Visual “feed-like” app preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs space-y-3">
              {/* Language selector row (mirrors app languages) */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-400">
                  Example: language &amp; masjid view
                </span>
                <div className="flex items-center gap-1">
                  {["IT", "DE", "EN", "AR", "UR"].map((lng, idx) => (
                    <button
                      key={lng}
                      className={`px-2 py-0.5 rounded-full text-[10px] border ${
                        idx === 0
                          ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                          : "border-slate-700 bg-slate-900 text-slate-300"
                      }`}
                    >
                      {lng}
                    </button>
                  ))}
                </div>
              </div>

              {/* Now + next block */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">
                    Today at Masjid al-Nur
                  </span>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-200 px-2 py-0.5 text-[10px]">
                    Next: Asr in 25 min
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Fajr · 05:32 (Jamāʿah 05:50)</span>
                  <span>Dhuhr · 12:25 (Jamāʿah 13:00)</span>
                </div>
              </div>

              {/* Announcement preview card (matching app feel) */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">
                    Extra Jumuʿah khutbah in German
                  </span>
                  <span className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                    Featured
                  </span>
                </div>
                <p className="text-slate-400">
                  This Friday we will have an additional khutbah in German at
                  14:30 for students and workers.
                </p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                  <span>Masjid al-Nur · Bolzano</span>
                  <span>Visible in the app until Fri 18:00</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For masjids */}
        <section
          id="for-masjids"
          className="border-b border-slate-900 bg-slate-950"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 grid gap-8 md:grid-cols-2 items-start">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                For mosques, boards &amp; imams
              </h2>
              <p className="mt-2 text-xs text-slate-400 max-w-md">
                The admin console is designed for real-world mosques – simple
                enough to use daily, professional enough to present to boards,
                municipalities and partners.
              </p>

              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li>• Secure admin login for your team</li>
                <li>• Manage daily prayer times and Jumuʿah schedule</li>
                <li>• Publish announcements with start/end dates and pinning</li>
                <li>• Configure Ramadan and iftar sponsorship rules</li>
                <li>• Local data hosting and a privacy-first approach</li>
              </ul>
            </div>

            {/* Visual admin console preview (closer to your real admin app) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wide">
                    Admin console
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Masjid al-Nur · Bolzano
                  </div>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">
                  super_admin
                </span>
              </div>

              {/* Tabs similar to your admin left sidebar */}
              <div className="flex gap-1 text-[10px] mb-2 overflow-x-auto">
                {[
                  "Masjids",
                  "Ramadan & Iftar",
                  "Iftar requests",
                  "Prayer times",
                  "Announcements",
                  "Analytics",
                ].map((label, idx) => (
                  <span
                    key={label}
                    className={`whitespace-nowrap rounded-full border px-2 py-0.5 ${
                      label === "Prayer times"
                        ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                        : "border-slate-700 bg-slate-900 text-slate-300"
                    }`}
                  >
                    {idx + 1}. {label}
                  </span>
                ))}
              </div>

              {/* Small "table" for prayer times */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-medium">
                    Daily prayer times · Friday
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Effective from 01.03.2026
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1 text-[10px] text-slate-400 border-b border-slate-800 pb-1 mb-1">
                  <span className="font-semibold text-slate-300">Prayer</span>
                  <span>Fajr</span>
                  <span>Dhuhr</span>
                  <span>Asr</span>
                  <span>Maghrib</span>
                  <span>Isha</span>
                </div>
                <div className="grid grid-cols-6 gap-1 text-[10px]">
                  <span className="text-slate-400">Start</span>
                  <span className="text-slate-100">05:32</span>
                  <span className="text-slate-100">12:25</span>
                  <span className="text-slate-100">15:40</span>
                  <span className="text-slate-100">17:12</span>
                  <span className="text-slate-100">18:30</span>
                </div>
                <div className="grid grid-cols-6 gap-1 text-[10px] mt-0.5">
                  <span className="text-slate-400">Jamāʿah</span>
                  <span className="text-slate-100">05:50</span>
                  <span className="text-slate-100">13:00</span>
                  <span className="text-slate-100">16:00</span>
                  <span className="text-slate-100">17:15</span>
                  <span className="text-slate-100">19:00</span>
                </div>
              </div>

              {/* Announcement editor snippet */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">
                    New announcement
                  </span>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-200 px-2 py-0.5 text-[10px]">
                    Draft
                  </span>
                </div>
                <div className="h-10 rounded-md bg-slate-950 border border-slate-800 px-2 flex items-center text-[11px] text-slate-500">
                  Extra Jumuʿah khutbah in German this Friday
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Visible: Fri 08:00 → Fri 18:00</span>
                  <span>Masjid al-Nur · Bolzano</span>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button className="px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-[10px] text-slate-200 hover:bg-slate-800">
                    Save draft
                  </button>
                  <button className="px-3 py-1 rounded-full bg-emerald-500 text-[10px] font-semibold text-emerald-950 hover:bg-emerald-400">
                    Publish
                  </button>
                </div>
              </div>

              <Link
                to="/login"
                className="inline-flex mt-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-800"
              >
                Open admin login
              </Link>
            </div>
          </div>
        </section>

        {/* CTA for boards */}
        <section className="bg-slate-950/95 border-b border-slate-900">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-950 px-5 py-4 sm:px-6 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-emerald-100">
                  Represent a masjid in South Tyrol or Trentino?
                </h3>
                <p className="mt-1 text-[11px] text-emerald-50/80 max-w-xl">
                  Ummah Way is currently onboarding local mosques. If you
                  are on the board, an imam or an official contact person, you
                  can request access to the admin console.
                </p>
              </div>
              <a
                href="mailto:info@example.com"
                className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-400"
              >
                Contact us for onboarding
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>© {currentYear} Ummah Way. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="hover:text-emerald-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-emerald-300 transition-colors"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              to="/login"
              className="hidden sm:inline hover:text-emerald-300 transition-colors"
            >
              Admin login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicHomePage;
