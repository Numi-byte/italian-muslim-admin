import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { TV_APP_URL } from "../lib/publicLinks";
import { getGlobalCanonicalUrl, setPageSeo } from "../lib/seo";

const TvPage: React.FC = () => {
  useEffect(() => {
    const canonicalUrl = getGlobalCanonicalUrl("/tv");
    setPageSeo({
      title: "UmmahWay TV Display | Prayer Times For Masjid Screens",
      description:
        "Open UmmahWay TV for screen-friendly masjid prayer times, Jumu'ah schedules, notices, and community display information.",
      canonicalUrl,
      imageUrl: "https://ummahway.com/icon.png",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "UmmahWay TV Display",
          url: canonicalUrl,
          description:
            "Screen-friendly prayer times, Jumu'ah schedules, notices, and community display information for masjids.",
          isPartOf: {
            "@type": "WebSite",
            name: "UmmahWay",
            url: "https://ummahway.com",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "UmmahWay",
              item: "https://ummahway.com",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "TV Display",
              item: canonicalUrl,
            },
          ],
        },
      ],
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1c2b26]">
      <header className="border-b border-[#e7e1d3] bg-[#f7f4ec]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-10 w-10 rounded-lg" />
            <div>
              <div className="font-display text-lg font-semibold text-[#0a3d30]">
                UmmahWay
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#9a8c68]">
                TV Display
              </div>
            </div>
          </Link>
          <Link
            to="/masjids"
            className="rounded-lg border border-[#d8cfb8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
          >
            Find masjids
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#d8cfb8]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                Hall screens
              </p>
            </div>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-tight text-[#0a3d30]">
              UmmahWay TV Display
            </h1>
            <p className="mt-4 text-base leading-7 text-[#4a5852]">
              Open a clean display for masjid halls, entrances, and community
              screens with prayer times, Jumu&apos;ah details, and important
              notices.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={TV_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-[#0f5c46] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0a3d30]/15 hover:bg-[#0a3d30]"
            >
              Open TV display
            </a>
            <Link
              to="/list-your-masjid"
              className="inline-flex items-center justify-center rounded-lg border border-[#d8cfb8] bg-white px-5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
            >
              List your masjid
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-[#e7e1d3] bg-white p-6 shadow-xl shadow-[#0a3d30]/10">
          <h2 className="font-display text-3xl font-semibold text-[#0a3d30]">
            Built for prayer spaces
          </h2>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-[#4a5852]">
            {[
              "Daily prayer times and jama'ah times stay visible at a glance.",
              "Jumu'ah schedules and masjid notices can be shown without a printed sheet.",
              "Each masjid can open the same display link from its official UmmahWay page.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-[#e7e1d3] bg-[#faf8f1] p-4"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TvPage;
