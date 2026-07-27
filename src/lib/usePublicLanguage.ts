import { useMemo } from "react";
import { useCountryPreference } from "./countryRouting";
import {
  isRtlLanguage,
  makeTranslator,
  type LanguageCode,
} from "./i18n";
import { useLanguagePreference } from "./languageRouting";

export function usePublicLanguage() {
  const countryPreference = useCountryPreference();
  const languageCode = useLanguagePreference(countryPreference.country.code);
  const dir = useMemo(
    () => (isRtlLanguage(languageCode) ? "rtl" : "ltr"),
    [languageCode]
  );
  const t = useMemo(() => makeTranslator(languageCode), [languageCode]);

  return {
    countryCode: countryPreference.country.code,
    dir,
    languageCode: languageCode as LanguageCode,
    t,
  };
}
