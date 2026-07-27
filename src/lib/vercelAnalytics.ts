import { track } from "@vercel/analytics";

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsProperties = Record<string, AnalyticsValue>;

const VALUE_LIMIT = 180;

export function trackSiteEvent(
  name: string,
  properties: AnalyticsProperties = {}
) {
  if (typeof window === "undefined") return;

  ensureVercelQueue();
  track(name, cleanProperties(properties));
}

export function sanitizeAnalyticsValue(value: string | undefined) {
  return stripControlCharacters(value ?? "").trim().slice(0, VALUE_LIMIT);
}

function cleanProperties(properties: AnalyticsProperties) {
  return Object.fromEntries(
    Object.entries(properties)
      .map(([key, value]) => [key, sanitizePropertyValue(value)] as const)
      .filter(([, value]) => value !== undefined)
  );
}

function sanitizePropertyValue(value: AnalyticsValue): AnalyticsValue {
  if (typeof value === "string") return sanitizeAnalyticsValue(value);
  return value;
}

function stripControlCharacters(value: string) {
  let sanitized = "";

  for (const character of value) {
    const code = character.charCodeAt(0);
    sanitized += code <= 31 || code === 127 ? " " : character;
  }

  return sanitized;
}

function ensureVercelQueue() {
  if (window.va) return;

  window.va = (event, properties) => {
    window.vaq = window.vaq || [];
    window.vaq.push([event, properties]);
  };
}
