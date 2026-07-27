import React, { useEffect } from "react";
import FooterLocaleControls from "../components/FooterLocaleControls";
import PublicNav from "../components/PublicNav";
import { ContactSupportPanel } from "./ContactPage";
import { getGlobalCanonicalUrl, setPageSeo } from "../lib/seo";
import { usePublicLanguage } from "../lib/usePublicLanguage";

const ListMasjidPage: React.FC = () => {
  const { countryCode, dir, languageCode, t } = usePublicLanguage();

  useEffect(() => {
    const canonicalUrl = getGlobalCanonicalUrl("/list-your-masjid");
    const description = t("publicPages.listMasjid.text");
    setPageSeo({
      title: t("links.listMasjid.name"),
      description,
      canonicalUrl,
      imageUrl: "https://ummahway.com/icon.png",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: t("links.listMasjid.name"),
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
              name: t("links.listMasjid.navLabel"),
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
        tagline={t("publicPages.listMasjid.tagline")}
        countryCode={countryCode}
        languageCode={languageCode}
      />

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="space-y-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#d8cfb8]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a8c68]">
                {t("publicPages.listMasjid.eyebrow")}
              </p>
            </div>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-tight text-[#0a3d30]">
              {t("publicPages.listMasjid.title")}
            </h1>
            <p className="mt-4 text-base leading-7 text-[#4a5852]">
              {t("publicPages.listMasjid.text")}
            </p>
          </div>

          <div className="grid gap-3 text-sm leading-6 text-[#4a5852]">
            {[
              t("publicPages.listMasjid.bulletPublic"),
              t("publicPages.listMasjid.bulletAdmin"),
              t("publicPages.listMasjid.bulletCountry"),
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

        <ContactSupportPanel
          defaultTopic="masjid_timings"
          languageCode={languageCode}
        />
      </main>

      <footer className="border-t border-[#e7e1d3] bg-[#f7f4ec]">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 text-sm font-medium text-[#4a5852] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <span className="text-[#9a8c68]">
            &copy; {new Date().getFullYear()} UmmahWay
          </span>
          <FooterLocaleControls
            countryCode={countryCode}
            languageCode={languageCode}
          />
        </div>
      </footer>
    </div>
  );
};

export default ListMasjidPage;
