import React from "react";
import {
  LANGUAGES,
  makeTranslator,
  type LanguageCode,
} from "../lib/i18n";
import { setLanguagePreference } from "../lib/languageRouting";

type LanguageSelectorProps = {
  selectedCode: LanguageCode;
  label?: string;
  className?: string;
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedCode,
  label,
  className = "",
}) => {
  const t = makeTranslator(selectedCode);
  const resolvedLabel = label ?? t("language.label");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguagePreference(event.target.value as LanguageCode);
    window.location.reload();
  };

  return (
    <label
      className={`inline-flex items-center gap-2 text-sm font-semibold ${className}`}
    >
      <span>{resolvedLabel}</span>
      <select
        value={selectedCode}
        onChange={handleChange}
        className="rounded-lg border border-[#d8cfb8] bg-white px-3 py-2 text-sm font-semibold text-[#1c2b26] outline-none transition hover:border-[#0f5c46]/40 focus:border-[#0f5c46] focus:ring-4 focus:ring-[#0f5c46]/12"
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSelector;
