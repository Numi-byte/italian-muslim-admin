// src/pages/PublicHomePage.tsx
// "HORIZON" - Premium landing page for UmmahWay
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* =========================================================
   Animated Components
   ========================================================= */

// Helper function to generate a single particle
const generateParticle = (id: number) => ({
  id,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: 2 + Math.random() * 4,
  duration: 15 + Math.random() * 20,
  delay: Math.random() * 10,
});

// Floating particles background
const FloatingParticles: React.FC = () => {
  const particles = React.useMemo(() => 
    Array.from({ length: 40 }, (_, i) => generateParticle(i)),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-emerald-400/20 animate-float"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// Animated counter
const AnimatedCounter: React.FC<{ end: number; suffix?: string; label: string }> = ({ end, suffix = "", label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-white">
        {count}{suffix}
      </div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
    </div>
  );
};

// Feature card with hover effect
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}> = ({ icon, title, description, color }) => (
  <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80 hover:-translate-y-1">
    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} mb-4 transition-transform duration-300 group-hover:scale-110`}>
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
  </div>
);

// App preview mockup
const PhoneMockup: React.FC = () => (
  <div className="relative">
    {/* Glow effect */}
    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-violet-500/20 rounded-[3rem] blur-2xl opacity-60" />
    
    {/* Phone frame */}
    <div className="relative bg-slate-950 rounded-[2.5rem] p-3 border border-slate-700/50 shadow-2xl">
      {/* Screen */}
      <div className="bg-slate-900 rounded-[2rem] overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-950">
          <span className="text-[10px] text-slate-400">9:41</span>
          <div className="w-20 h-5 bg-slate-800 rounded-full" />
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 border border-slate-400 rounded-sm">
              <div className="w-3/4 h-full bg-emerald-400 rounded-sm" />
            </div>
          </div>
        </div>

        {/* App content */}
        <div className="px-4 py-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-emerald-400 font-medium">Good afternoon</p>
              <p className="text-sm font-semibold text-white">Saturday, 25 January</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
          </div>

          {/* Masjid card */}
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-white">Masjid al-Huda</p>
                <p className="text-[10px] text-slate-400">Bolzano · Via Roma 12</p>
              </div>
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Next prayer card */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-3 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-emerald-300 uppercase tracking-wider">Next Prayer</p>
                <p className="text-lg font-bold text-white mt-0.5">Asr</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-400">15:45</p>
                <p className="text-[10px] text-emerald-300">in 2h 34m</p>
              </div>
            </div>
          </div>

          {/* Prayer times grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { name: "Fajr", time: "06:15", passed: true },
              { name: "Dhuhr", time: "12:30", passed: true },
              { name: "Asr", time: "15:45", passed: false, active: true },
              { name: "Maghrib", time: "17:28", passed: false },
              { name: "Isha", time: "19:00", passed: false },
            ].map((prayer) => (
              <div
                key={prayer.name}
                className={`rounded-lg p-2 text-center ${
                  prayer.active
                    ? "bg-emerald-500/20 border border-emerald-500/40"
                    : prayer.passed
                    ? "bg-slate-800/30"
                    : "bg-slate-800/50"
                }`}
              >
                <p className={`text-[9px] ${prayer.active ? "text-emerald-300" : prayer.passed ? "text-slate-500" : "text-slate-400"}`}>
                  {prayer.name}
                </p>
                <p className={`text-[11px] font-semibold ${prayer.active ? "text-emerald-400" : prayer.passed ? "text-slate-500" : "text-white"}`}>
                  {prayer.time}
                </p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "📅", label: "Schedule" },
              { icon: "📢", label: "News" },
              { icon: "🕌", label: "Masjids" },
            ].map((action) => (
              <div key={action.label} className="bg-slate-800/50 rounded-xl p-2.5 text-center border border-slate-700/50">
                <span className="text-base">{action.icon}</span>
                <p className="text-[9px] text-slate-400 mt-1">{action.label}</p>
              </div>
            ))}
          </div>

          {/* Announcement preview */}
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Jumu'ah
                  </span>
                  <span className="text-[9px] text-slate-500">Today</span>
                </div>
                <p className="text-xs text-white mt-1.5 font-medium">German khutbah at 14:30</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Additional Friday prayer...</p>
              </div>
              <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800">
          <div className="flex items-center justify-around">
            {[
              { icon: "🏠", label: "Home", active: true },
              { icon: "🕐", label: "Prayers", active: false },
              { icon: "📢", label: "News", active: false },
              { icon: "⚙️", label: "Settings", active: false },
            ].map((tab) => (
              <div key={tab.label} className="flex flex-col items-center gap-0.5">
                <span className={`text-sm ${tab.active ? "" : "opacity-50"}`}>{tab.icon}</span>
                <span className={`text-[9px] ${tab.active ? "text-emerald-400" : "text-slate-500"}`}>
                  {tab.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* =========================================================
   Main Component
   ========================================================= */

const PublicHomePage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Custom styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
        .animate-float { animation: float ease-in-out infinite; }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        
        .gradient-text {
          background: linear-gradient(135deg, #34d399 0%, #22d3ee 50%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Navigation */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 50 
            ? "bg-slate-950/90 backdrop-blur-lg border-b border-slate-800/50" 
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-xl blur-lg animate-pulse-glow" />
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <span className="text-sm font-bold text-white">UW</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-semibold text-white">UmmahWay</span>
              <span className="block text-[10px] text-slate-400 -mt-0.5">South Tyrol & Trentino</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How it works", "For Masjids"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-slate-300 hover:text-emerald-400 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-slate-300 hover:text-white transition-colors hidden sm:block"
            >
              Admin Login
            </Link>
            <button className="px-4 py-2 rounded-full bg-emerald-500 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25">
              Download App
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <FloatingParticles />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero content */}
            <div className="animate-slide-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-sm text-emerald-300">Now available for South Tyrol & Trentino</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Your masjid's schedule,{" "}
                <span className="gradient-text">always in your pocket</span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-lg text-slate-300 max-w-xl leading-relaxed">
                UmmahWay connects you with your local masjid's official prayer times, 
                Jumu'ah schedules, and community announcements — all verified and updated 
                directly by mosque administrators.
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                <button className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Get the App</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <a
                  href="#how-it-works"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-200 font-medium hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  See how it works
                </a>
              </div>

              {/* Trust indicators */}
              <div className="mt-10 flex flex-wrap gap-6">
                {[
                  { icon: "✓", text: "Verified timings", color: "text-emerald-400" },
                  { icon: "🌍", text: "5 languages", color: "text-cyan-400" },
                  { icon: "🔒", text: "Privacy first", color: "text-violet-400" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className={item.color}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <PhoneMockup />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-slate-500">Scroll to explore</span>
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-800/50 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedCounter end={12} suffix="+" label="Masjids connected" />
            <AnimatedCounter end={5} label="Languages supported" />
            <AnimatedCounter end={1000} suffix="+" label="Daily users" />
            <AnimatedCounter end={99} suffix="%" label="Uptime guarantee" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Features</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
              Everything you need to stay connected with your masjid
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              One app for prayer times, announcements, and community updates — no chat, no spam, just verified information.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="Live Prayer Times"
              description="Get accurate start times and Jamā'ah times for all five daily prayers, updated directly by your masjid."
              color="bg-emerald-500/10"
            />
            <FeatureCard
              icon={<svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              title="Jumu'ah Schedule"
              description="View Friday prayer slots, khutbah times, and languages — never miss Jumu'ah again."
              color="bg-cyan-500/10"
            />
            <FeatureCard
              icon={<svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
              title="Announcements"
              description="Receive important updates, event notifications, and community news from your masjid's admin team."
              color="bg-violet-500/10"
            />
            <FeatureCard
              icon={<svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
              title="Ramadan Ready"
              description="Special Ramadan features including iftar times, taraweeh schedules, and sponsorship opportunities."
              color="bg-amber-500/10"
            />
            <FeatureCard
              icon={<svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>}
              title="Multilingual"
              description="Available in Italian, German, English, Arabic, and Urdu — serving our diverse community."
              color="bg-rose-500/10"
            />
            <FeatureCard
              icon={<svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              title="Privacy First"
              description="No public chat, no comments, no tracking — just verified information from your masjid."
              color="bg-slate-500/10"
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">How it works</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
              Simple for everyone
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              UmmahWay is designed to be easy for both worshippers and mosque administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choose your masjid",
                description: "Select your local masjid from our list of verified mosques in South Tyrol and Trentino.",
                icon: "🕌",
              },
              {
                step: "02",
                title: "Get live updates",
                description: "Receive prayer times, Jumu'ah schedules, and announcements directly from your masjid's admin.",
                icon: "📱",
              },
              {
                step: "03",
                title: "Stay connected",
                description: "Never miss a prayer or important community update. All information is verified and official.",
                icon: "✨",
              },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-slate-700 to-transparent -translate-x-8" />
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-6">
                    <span className="text-4xl">{item.icon}</span>
                  </div>
                  <div className="text-xs font-medium text-emerald-400 mb-2">Step {item.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Masjids Section */}
      <section id="for-masjids" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">For Masjids</span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
                Powerful admin tools for mosque management
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                UmmahWay provides mosque administrators with a secure, easy-to-use dashboard 
                to manage prayer times, announcements, and community engagement.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Secure admin login for your team",
                  "Manage daily prayer times with ease",
                  "Publish announcements with scheduling",
                  "Configure Ramadan and iftar settings",
                  "Analytics and community insights",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-300">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors"
                >
                  Admin Login
                </Link>
                <a
                  href="mailto:info@ummahway.com"
                  className="px-6 py-3 rounded-xl border border-slate-700 text-slate-200 font-medium hover:bg-slate-800 transition-colors"
                >
                  Request Access
                </a>
              </div>
            </div>

            {/* Admin preview */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-white">Admin Console</h3>
                  <p className="text-sm text-slate-400">Masjid al-Huda · Bolzano</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/30">
                  Online
                </span>
              </div>

              {/* Mini dashboard */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Today's visits", value: "234" },
                  { label: "Active users", value: "89" },
                  { label: "Announcements", value: "3" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Prayer times table preview */}
              <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">Today's Prayer Times</span>
                  <button className="text-xs text-emerald-400 hover:text-emerald-300">Edit</button>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((prayer) => (
                    <div key={prayer}>
                      <div className="text-slate-400 mb-1">{prayer}</div>
                      <div className="text-white font-medium">
                        {prayer === "Fajr" ? "06:15" : prayer === "Dhuhr" ? "12:30" : prayer === "Asr" ? "15:45" : prayer === "Maghrib" ? "17:28" : "19:00"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                  + New Announcement
                </button>
                <button className="flex-1 py-2 rounded-lg bg-slate-700/50 text-slate-300 text-xs border border-slate-600 hover:bg-slate-700 transition-colors">
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-violet-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12">
              <span className="text-4xl mb-6 block">🕌</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to connect with your masjid?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Download UmmahWay today and never miss a prayer time or community announcement again.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button className="px-8 py-4 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25">
                  Download for Free
                </button>
                <a
                  href="mailto:info@ummahway.com"
                  className="px-8 py-4 rounded-xl border border-slate-700 text-slate-200 font-medium hover:bg-slate-800 transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">UW</span>
                </div>
                <span className="text-lg font-semibold text-white">UmmahWay</span>
              </div>
              <p className="text-sm text-slate-400 max-w-xs">
                Connecting communities with their masjids in South Tyrol and Trentino.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How it works</a></li>
                <li><a href="#for-masjids" className="hover:text-emerald-400 transition-colors">For Masjids</a></li>
                <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Admin Login</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:info@ummahway.com" className="hover:text-emerald-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {currentYear} UmmahWay. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">Made with ❤️ for our community</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicHomePage;