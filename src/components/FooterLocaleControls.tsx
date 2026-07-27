import React from "react";
import type { CountryCode } from "../lib/countryConfig";
import { makeTranslator, type LanguageCode } from "../lib/i18n";
import CountrySelector from "./CountrySelector";
import LanguageSelector from "./LanguageSelector";

type FooterLocaleControlsProps = {
  countryCode?: CountryCode;
  languageCode: LanguageCode;
  currentPath?: string;
  className?: string;
};

const FooterLocaleControls: React.FC<FooterLocaleControlsProps> = ({
  countryCode,
  languageCode,
  currentPath,
  className = "",
}) => {
  const t = makeTranslator(languageCode);

  return (
    <div
      className={`hidden flex-wrap items-center gap-3 rounded-xl border border-[#e7e1d3] bg-white/70 px-3 py-2 shadow-sm lg:flex ${className}`}
    >
      {countryCode && (
        <CountrySelector
          selectedCode={countryCode}
          currentPath={currentPath}
          label={t("language.country")}
          className="text-[#4a5852]"
        />
      )}
      <LanguageSelector
        selectedCode={languageCode}
        className="text-[#4a5852]"
      />
    </div>
  );
};

export default FooterLocaleControls;
