export type CountryCode =
  | "it"
  | "de"
  | "at"
  | "ch"
  | "fr"
  | "uk"
  | "us"
  | "ca"
  | "nl"
  | "be"
  | "es";

export type CountryConfig = {
  code: CountryCode;
  name: string;
  localName: string;
  language: string;
  countryIso: string;
  defaultTimeZone: string;
  ccTlds: string[];
  timezoneHints: string[];
  cityHints?: string[];
  regionHints?: string[];
};

export const DEFAULT_COUNTRY_CODE: CountryCode = "it";
export const COUNTRY_STORAGE_KEY = "ummahway.country";
export const PRIMARY_GLOBAL_DOMAIN = "ummahway.com";
export const GENERIC_COUNTRY_PICKER_DOMAINS = [
  "ummahway.com",
  "www.ummahway.com",
  "ummahway.eu",
  "www.ummahway.eu",
];

export const COUNTRIES: CountryConfig[] = [
  {
    code: "it",
    name: "Italy",
    localName: "Italia",
    language: "it-IT",
    countryIso: "IT",
    defaultTimeZone: "Europe/Rome",
    ccTlds: ["it"],
    timezoneHints: ["Europe/Rome", "Europe/Vatican", "Europe/San_Marino"],
    cityHints: ["Bolzano", "Bozen", "Rovereto", "Trento", "Merano", "Meran"],
    regionHints: ["Trentino", "Alto Adige", "Suedtirol", "Sudtirol", "South Tyrol"],
  },
  {
    code: "de",
    name: "Germany",
    localName: "Deutschland",
    language: "de-DE",
    countryIso: "DE",
    defaultTimeZone: "Europe/Berlin",
    ccTlds: ["de"],
    timezoneHints: ["Europe/Berlin"],
  },
  {
    code: "at",
    name: "Austria",
    localName: "Osterreich",
    language: "de-AT",
    countryIso: "AT",
    defaultTimeZone: "Europe/Vienna",
    ccTlds: ["at"],
    timezoneHints: ["Europe/Vienna"],
  },
  {
    code: "ch",
    name: "Switzerland",
    localName: "Schweiz",
    language: "de-CH",
    countryIso: "CH",
    defaultTimeZone: "Europe/Zurich",
    ccTlds: ["ch"],
    timezoneHints: ["Europe/Zurich"],
  },
  {
    code: "fr",
    name: "France",
    localName: "France",
    language: "fr-FR",
    countryIso: "FR",
    defaultTimeZone: "Europe/Paris",
    ccTlds: ["fr"],
    timezoneHints: ["Europe/Paris"],
  },
  {
    code: "uk",
    name: "United Kingdom",
    localName: "United Kingdom",
    language: "en-GB",
    countryIso: "GB",
    defaultTimeZone: "Europe/London",
    ccTlds: ["uk"],
    timezoneHints: ["Europe/London"],
  },
  {
    code: "us",
    name: "United States",
    localName: "United States",
    language: "en-US",
    countryIso: "US",
    defaultTimeZone: "America/New_York",
    ccTlds: ["us"],
    timezoneHints: [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
    ],
  },
  {
    code: "ca",
    name: "Canada",
    localName: "Canada",
    language: "en-CA",
    countryIso: "CA",
    defaultTimeZone: "America/Toronto",
    ccTlds: ["ca"],
    timezoneHints: [
      "America/Toronto",
      "America/Vancouver",
      "America/Edmonton",
      "America/Winnipeg",
      "America/Halifax",
    ],
  },
  {
    code: "nl",
    name: "Netherlands",
    localName: "Nederland",
    language: "nl-NL",
    countryIso: "NL",
    defaultTimeZone: "Europe/Amsterdam",
    ccTlds: ["nl"],
    timezoneHints: ["Europe/Amsterdam"],
  },
  {
    code: "be",
    name: "Belgium",
    localName: "Belgie",
    language: "nl-BE",
    countryIso: "BE",
    defaultTimeZone: "Europe/Brussels",
    ccTlds: ["be"],
    timezoneHints: ["Europe/Brussels"],
  },
  {
    code: "es",
    name: "Spain",
    localName: "Espana",
    language: "es-ES",
    countryIso: "ES",
    defaultTimeZone: "Europe/Madrid",
    ccTlds: ["es"],
    timezoneHints: ["Europe/Madrid"],
  },
];

const ccTldMap = COUNTRIES.reduce<Record<string, CountryCode>>((acc, country) => {
  country.ccTlds.forEach((tld) => {
    acc[tld] = country.code;
  });
  return acc;
}, {});

const OWNED_COUNTRY_DOMAINS: Partial<Record<CountryCode, string[]>> = {
  uk: ["ummahway.co.uk", "www.ummahway.co.uk"],
  de: ["ummahway.de", "www.ummahway.de"],
  nl: ["ummahway.nl", "www.ummahway.nl"],
};

export function getCountryByCode(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return COUNTRIES.find((country) => country.code === normalized) ?? null;
}

export function getDefaultCountry() {
  return getCountryByCode(DEFAULT_COUNTRY_CODE) ?? COUNTRIES[0];
}

export function normalizeHostname(hostname: string) {
  return hostname
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
}

export function getCountryFromHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);
  const exactCountry = getCountryFromConfiguredDomains(normalized);
  if (exactCountry) return { country: exactCountry, source: "configured-domain" as const };

  if (normalized === "localhost" || normalized === "127.0.0.1") {
    return { country: getDefaultCountry(), source: "local" as const };
  }

  if (normalized.endsWith(".co.uk") || normalized.endsWith(".org.uk")) {
    return { country: getCountryByCode("uk") ?? getDefaultCountry(), source: "cc-tld" as const };
  }

  const tld = normalized.split(".").pop();
  const tldCountry = tld ? getCountryByCode(ccTldMap[tld]) : null;
  if (tldCountry) return { country: tldCountry, source: "cc-tld" as const };

  return { country: getDefaultCountry(), source: "default" as const };
}

export function getCountryFromConfiguredDomains(hostname: string) {
  const normalized = normalizeHostname(hostname);
  const domains = getConfiguredCountryDomains();

  for (const country of COUNTRIES) {
    if (domains[country.code]?.some((domain) => normalizeHostname(domain) === normalized)) {
      return country;
    }
  }

  return null;
}

export function getConfiguredCountryDomains() {
  const result: Partial<Record<CountryCode, string[]>> = Object.fromEntries(
    Object.entries(OWNED_COUNTRY_DOMAINS).map(([code, domains]) => [code, [...domains]])
  ) as Partial<Record<CountryCode, string[]>>;
  const raw = import.meta.env.VITE_COUNTRY_DOMAINS as string | undefined;
  if (!raw) return result;

  raw.split(";").forEach((entry) => {
    const [rawCode, rawDomains] = entry.split("=");
    const country = getCountryByCode(rawCode);
    if (!country || !rawDomains) return;

    const envDomains = rawDomains
      .split(",")
      .map((domain) => domain.trim())
      .filter(Boolean);

    result[country.code] = Array.from(
      new Set([...(result[country.code] ?? []), ...envDomains])
    );
  });

  return result;
}

export function getPrimaryDomainForCountry(code: CountryCode) {
  return getConfiguredCountryDomains()[code]?.[0] ?? null;
}

export function getCountryUrl(code: CountryCode, path: string, currentOrigin: string) {
  const countryDomain = getPrimaryDomainForCountry(code);
  const targetPath = path.startsWith("/") ? path : `/${path}`;

  if (countryDomain) {
    return `https://${countryDomain}${targetPath}`;
  }

  const url = new URL(targetPath, currentOrigin);
  url.searchParams.set("country", code);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function inferMasjidCountryCode(masjid: {
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
  region?: string | null;
  timezone?: string | null;
}) {
  const explicitCountry = getCountryByCode(masjid.country_code ?? masjid.country);
  if (explicitCountry) return explicitCountry.code;

  const timezone = masjid.timezone?.trim();
  if (timezone) {
    const match = COUNTRIES.find((country) =>
      country.timezoneHints.some((hint) => hint.toLowerCase() === timezone.toLowerCase())
    );
    if (match) return match.code;
  }

  const city = masjid.city?.toLowerCase() ?? "";
  const region = masjid.region?.toLowerCase() ?? "";
  const locationText = `${city} ${region}`;

  const locationMatch = COUNTRIES.find((country) => {
    const hints = [...(country.cityHints ?? []), ...(country.regionHints ?? [])];
    return hints.some((hint) => locationText.includes(hint.toLowerCase()));
  });

  return locationMatch?.code ?? null;
}

export function getCountryQueryValue(search: string) {
  return getCountryByCode(new URLSearchParams(search).get("country"));
}
