import React, { useEffect } from "react";
import { Link } from "react-router";
import PublicNav from "../components/PublicNav";
import { TV_APP_URL } from "../lib/publicLinks";
import { getGlobalCanonicalUrl, setPageSeo } from "../lib/seo";
import { usePublicLanguage } from "../lib/usePublicLanguage";

const TvPage: React.FC = () => {
  const { countryCode, dir, languageCode, t } = usePublicLanguage();

  useEffect(() => {
    const canonicalUrl = getGlobalCanonicalUrl("/tv");
    const description = t("links.tv.description");
    setPageSeo({
      title: t("links.tv.name"),
      description,
      canonicalUrl,
      imageUrl: "https://ummahway.com/icon.png",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t("links.tv.name"),
          url: canonicalUrl,
          description,
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
              name: t("links.tv.navLabel"),
              item: canonicalUrl,
            },
          ],
        },
      ],
    });
  }, [t]);

  return (
    <div
      className="min-h-screen bg-[#f7f4ec] text-[#1c2b26]"
      dir={dir}
      lang={languageCode}
    >
      <PublicNav
        tagline={t("publicPages.tv.tagline")}
        countryCode={countryCode}
        languageCode={languageCode}
      />

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#d8cfb8]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                {t("publicPages.tv.eyebrow")}
              </p>
            </div>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-tight text-[#0a3d30]">
              {t("publicPages.tv.title")}
            </h1>
            <p className="mt-4 text-base leading-7 text-[#4a5852]">
              {t("publicPages.tv.text")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={TV_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-[#0f5c46] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0a3d30]/15 hover:bg-[#0a3d30]"
            >
              {t("publicPages.tv.openDisplay")}
            </a>
            <Link
              to="/list-your-masjid"
              className="inline-flex items-center justify-center rounded-lg border border-[#d8cfb8] bg-white px-5 py-3 text-sm font-semibold text-[#1c2b26] hover:border-[#0f5c46]/40"
            >
              {t("publicPages.tv.listMasjid")}
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-[#e7e1d3] bg-white p-6 shadow-xl shadow-[#0a3d30]/10">
          <h2 className="font-display text-3xl font-semibold text-[#0a3d30]">
            {t("publicPages.tv.cardTitle")}
          </h2>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-[#4a5852]">
            {[
              t("publicPages.tv.bulletTimes"),
              t("publicPages.tv.bulletJumuah"),
              t("publicPages.tv.bulletLink"),
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
