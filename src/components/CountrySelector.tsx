import React from "react";
import {
  COUNTRIES,
  type CountryCode,
  getCountryUrl,
} from "../lib/countryConfig";
import { saveCountryPreference } from "../lib/countryRouting";

type CountrySelectorProps = {
  selectedCode: CountryCode;
  currentPath?: string;
  label?: string;
  className?: string;
};

const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCode,
  currentPath,
  label = "Country",
  className = "",
}) => {
  const path =
    currentPath ??
    (typeof window === "undefined"
      ? "/"
      : `${window.location.pathname}${window.location.hash}`);
  const currentOrigin =
    typeof window === "undefined" ? "https://ummahway.com" : window.location.origin;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const code = event.target.value as CountryCode;
    saveCountryPreference(code);
    window.location.href = getCountryUrl(code, path, currentOrigin);
  };

  return (
    <label className={`inline-flex items-center gap-2 text-sm font-semibold ${className}`}>
      <span>{label}</span>
      <select
        value={selectedCode}
        onChange={handleChange}
        className="rounded-lg border border-[#d8cfb8] bg-white px-3 py-2 text-sm font-semibold text-[#1c2b26] outline-none transition hover:border-[#0f5c46]/40 focus:border-[#0f5c46] focus:ring-4 focus:ring-[#0f5c46]/12"
      >
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
    </label>
  );
};

export default CountrySelector;
