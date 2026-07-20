import { useMemo, useState } from "react";
import {
  COUNTRIES,
  COUNTRY_STORAGE_KEY,
  type CountryCode,
  getCountryByCode,
  getCountryFromHostname,
  getCountryQueryValue,
} from "./countryConfig";

export type CountryPreference = {
  country: (typeof COUNTRIES)[number];
  needsChoice: boolean;
  source: "query" | "storage" | "configured-domain" | "cc-tld" | "local" | "default";
};

export function useCountryPreference(): CountryPreference {
  const detected = useMemo(() => {
    if (typeof window === "undefined") {
      return getCountryFromHostname("");
    }

    const queryCountry = getCountryQueryValue(window.location.search);
    if (queryCountry) {
      return { country: queryCountry, source: "query" as const };
    }

    return getCountryFromHostname(window.location.hostname);
  }, []);

  const [storedCountry] = useState(() => {
    if (typeof window === "undefined") return null;
    return getCountryByCode(window.localStorage.getItem(COUNTRY_STORAGE_KEY));
  });

  if (detected.source === "default" && storedCountry) {
    return {
      country: storedCountry,
      needsChoice: false,
      source: "storage",
    };
  }

  return {
    country: detected.country,
    needsChoice: detected.source === "default",
    source: detected.source,
  };
}

export function saveCountryPreference(code: CountryCode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COUNTRY_STORAGE_KEY, code);
}
