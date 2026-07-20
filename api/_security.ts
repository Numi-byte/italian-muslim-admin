import type { IncomingMessage, ServerResponse } from "node:http";

type CorsOptions = {
  methods: string;
  headers?: string;
};

const TRUSTED_HOSTS = new Set([
  "ummahway.com",
  "www.ummahway.com",
  "ummahway.eu",
  "www.ummahway.eu",
  "ummahway.co.uk",
  "www.ummahway.co.uk",
  "ummahway.de",
  "www.ummahway.de",
  "ummahway.nl",
  "www.ummahway.nl",
  "localhost:5173",
  "localhost:4173",
  "127.0.0.1:5173",
  "127.0.0.1:4173",
]);

export function setApiSecurityHeaders(response: ServerResponse) {
  setHeaderIfMissing(response, "X-Content-Type-Options", "nosniff");
  setHeaderIfMissing(response, "X-Frame-Options", "DENY");
  setHeaderIfMissing(response, "Referrer-Policy", "strict-origin-when-cross-origin");
  setHeaderIfMissing(response, "X-Robots-Tag", "noindex, nofollow");
  setHeaderIfMissing(response, "Permissions-Policy", "camera=(), microphone=(), payment=(), usb=(), bluetooth=(), display-capture=()");
}

export function handleCorsPreflight(
  request: IncomingMessage,
  response: ServerResponse,
  options: CorsOptions
) {
  setApiSecurityHeaders(response);

  if (!setCorsOriginIfTrusted(request, response)) {
    response.statusCode = 403;
    response.end();
    return;
  }

  response.statusCode = 204;
  response.setHeader("Access-Control-Allow-Methods", options.methods);
  response.setHeader(
    "Access-Control-Allow-Headers",
    options.headers ?? "Authorization, Content-Type"
  );
  response.setHeader("Access-Control-Max-Age", "600");
  response.end();
}

export function requireTrustedOrigin(
  request: IncomingMessage,
  response: ServerResponse
) {
  setApiSecurityHeaders(response);

  if (setCorsOriginIfTrusted(request, response)) return true;

  response.statusCode = 403;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify({ error: "Origin is not allowed." }));
  return false;
}

export function setNoStore(response: ServerResponse) {
  response.setHeader("Cache-Control", "no-store");
}

export function firstHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function setCorsOriginIfTrusted(
  request: IncomingMessage,
  response: ServerResponse
) {
  const origin = firstHeaderValue(request.headers.origin);
  if (!origin) return true;

  const originHost = parseOriginHost(origin);
  if (!originHost || !isTrustedHost(originHost, request)) return false;

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Vary", appendVary(response.getHeader("Vary"), "Origin"));
  return true;
}

function isTrustedHost(originHost: string, request: IncomingMessage) {
  const requestHost = normalizeHost(
    firstHeaderValue(request.headers["x-forwarded-host"]) ??
      firstHeaderValue(request.headers.host)
  );

  if (requestHost && originHost === requestHost) return true;
  if (TRUSTED_HOSTS.has(originHost)) return true;

  const vercelUrl = normalizeHost(process.env.VERCEL_URL);
  if (vercelUrl && originHost === vercelUrl) return true;

  return getExtraTrustedHosts().has(originHost);
}

function getExtraTrustedHosts() {
  const hosts = new Set<string>();
  const raw =
    process.env.ALLOWED_ORIGINS ??
    process.env.VITE_ALLOWED_ORIGINS ??
    process.env.VITE_COUNTRY_DOMAINS;

  raw
    ?.split(/[;,]/)
    .map((entry) => entry.split("=").pop() ?? entry)
    .map((value) => normalizeHost(value))
    .filter((host): host is string => Boolean(host))
    .forEach((host) => hosts.add(host));

  return hosts;
}

function parseOriginHost(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && !isLocalProtocol(url)) return null;
    return normalizeHost(url.host);
  } catch {
    return null;
  }
}

function isLocalProtocol(url: URL) {
  return url.protocol === "http:" && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(url.host);
}

function normalizeHost(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function appendVary(existing: number | string | string[] | undefined, value: string) {
  const current = Array.isArray(existing)
    ? existing.join(", ")
    : existing == null
      ? ""
      : String(existing);
  const parts = current
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.some((part) => part.toLowerCase() === value.toLowerCase())) {
    parts.push(value);
  }

  return parts.join(", ");
}

function setHeaderIfMissing(
  response: ServerResponse,
  key: string,
  value: string
) {
  if (!response.hasHeader(key)) response.setHeader(key, value);
}
