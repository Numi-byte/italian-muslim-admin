import { useMemo, useState } from "react";
import type { CountryCode } from "./countryConfig";
import {
  getDefaultLanguageForCountry,
  getStoredLanguage,
  normalizeLanguageCode,
  saveLanguagePreference,
  type LanguageCode,
} from "./i18n";

export function useLanguagePreference(countryCode: CountryCode): LanguageCode {
  const detected = useMemo(() => {
    if (typeof window === "undefined") return null;
    return normalizeLanguageCode(new URLSearchParams(window.location.search).get("lang"));
  }, []);
  const [storedLanguage] = useState(() => getStoredLanguage());

  return detected ?? storedLanguage ?? getDefaultLanguageForCountry(countryCode);
}

export function setLanguagePreference(code: LanguageCode) {
  saveLanguagePreference(code);
}
