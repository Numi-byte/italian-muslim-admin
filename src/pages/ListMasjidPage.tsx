import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ContactSupportPanel } from "./ContactPage";
import { getGlobalCanonicalUrl, setPageSeo } from "../lib/seo";

const ListMasjidPage: React.FC = () => {
  useEffect(() => {
    const canonicalUrl = getGlobalCanonicalUrl("/list-your-masjid");
    setPageSeo({
      title: "List Your Masjid On UmmahWay | Official Masjid Websites",
      description:
        "Create an official UmmahWay masjid page with prayer times, Jumu'ah schedules, announcements, maps, and TV display access.",
      canonicalUrl,
      imageUrl: "https://ummahway.com/icon.png",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "List Your Masjid On UmmahWay",
          url: canonicalUrl,
          description:
            "Create an official UmmahWay masjid page with prayer times, Jumu'ah schedules, announcements, maps, and TV display access.",
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
              name: "List Your Masjid",
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
                Masjid onboarding
              </div>
            </div>
          </Link>
          <Link
            to="/masjids"
            className="rounded-lg border border-[#d8cfb8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
          >
            View masjids
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="space-y-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#d8cfb8]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                Official masjid pages
              </p>
            </div>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-tight text-[#0a3d30]">
              List your masjid on UmmahWay
            </h1>
            <p className="mt-4 text-base leading-7 text-[#4a5852]">
              Give your community one official place for prayer times,
              Jumu&apos;ah schedules, announcements, directions, and TV display
              access.
            </p>
          </div>

          <div className="grid gap-3 text-sm leading-6 text-[#4a5852]">
            {[
              "A public page that can become the masjid's official website.",
              "Admin access for trusted volunteers who keep timings and notices updated.",
              "Country-aware discovery so people can find local masjids faster.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-[#e7e1d3] bg-white p-4 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <ContactSupportPanel defaultTopic="masjid_timings" />
      </main>
    </div>
  );
};

export default ListMasjidPage;
