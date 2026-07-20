import {
  COUNTRIES,
  PRIMARY_GLOBAL_DOMAIN,
  type CountryCode,
  getCountryUrl,
  getPrimaryDomainForCountry,
} from "./countryConfig";

type AlternateLink = {
  href: string;
  hrefLang: string;
};

type SeoOptions = {
  title: string;
  description: string;
  canonicalUrl: string;
  alternates?: AlternateLink[];
  imageUrl?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  robots?: string;
};

export function setPageSeo(options: SeoOptions) {
  if (typeof document === "undefined") return;

  document.title = options.title;
  document.documentElement.lang = "en";

  upsertMeta("name", "description", options.description);
  upsertMeta("property", "og:title", options.title);
  upsertMeta("property", "og:description", options.description);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:url", options.canonicalUrl);
  upsertMeta("name", "robots", options.robots ?? "index,follow");
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", options.title);
  upsertMeta("name", "twitter:description", options.description);

  if (options.imageUrl) {
    upsertMeta("property", "og:image", options.imageUrl);
    upsertMeta("name", "twitter:image", options.imageUrl);
  }

  upsertLink("canonical", options.canonicalUrl);
  removeManagedAlternateLinks();
  options.alternates?.forEach((alternate) => {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.setAttribute("hreflang", alternate.hrefLang);
    link.href = alternate.href;
    link.dataset.ummahwaySeo = "alternate";
    document.head.appendChild(link);
  });

  const jsonLd = Array.isArray(options.jsonLd) ? options.jsonLd : options.jsonLd ? [options.jsonLd] : [];
  const existingScript = document.querySelector<HTMLScriptElement>(
    'script[data-ummahway-seo="json-ld"]'
  );
  if (jsonLd.length === 0) {
    existingScript?.remove();
    return;
  }

  const script = existingScript ?? document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.ummahwaySeo = "json-ld";
  script.textContent = JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd);
  if (!existingScript) document.head.appendChild(script);
}

export function getCanonicalUrl(countryCode: CountryCode, path: string) {
  if (typeof window === "undefined") return `https://${PRIMARY_GLOBAL_DOMAIN}${path}`;
  const domain = getPrimaryDomainForCountry(countryCode);
  const origin = domain ? `https://${domain}` : window.location.origin;
  const url = new URL(path, origin);
  if (!domain && window.location.search) {
    url.searchParams.set("country", countryCode);
  }
  return url.toString();
}

export function getGlobalCanonicalUrl(path: string) {
  return `https://${PRIMARY_GLOBAL_DOMAIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getCountryAlternates(path: string) {
  if (typeof window === "undefined") return [];
  return [
    ...COUNTRIES.map((country) => ({
      href: getCountryUrl(country.code, path, window.location.origin),
      hrefLang: country.language,
    })),
    {
      href: `https://${PRIMARY_GLOBAL_DOMAIN}${path}`,
      hrefLang: "x-default",
    },
  ];
}

function upsertMeta(attributeName: "name" | "property", attributeValue: string, content: string) {
  const selector = `meta[${attributeName}="${attributeValue}"]`;
  let meta = document.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attributeName, attributeValue);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function upsertLink(rel: string, href: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

function removeManagedAlternateLinks() {
  document
    .querySelectorAll('link[data-ummahway-seo="alternate"]')
    .forEach((link) => link.remove());
}
