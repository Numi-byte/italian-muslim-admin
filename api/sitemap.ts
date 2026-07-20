import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { setApiSecurityHeaders } from "./_security.js";

type PublicMasjid = {
  slug: string;
};

const STATIC_PATHS = [
  "/",
  "/masjids",
  "/list-your-masjid",
  "/tv",
  "/sponsor",
  "/contact",
  "/privacy",
  "/terms",
];

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
) {
  setApiSecurityHeaders(response);

  if (request.method !== "GET") {
    response.statusCode = 405;
    response.end("Method not allowed");
    return;
  }

  const origin = getRequestOrigin(request);
  const masjids = await loadMasjids();
  const urls = [
    ...STATIC_PATHS.map((path) => `${origin}${path}`),
    ...masjids.map((masjid) => `${origin}/masjids/${encodeURIComponent(masjid.slug)}`),
  ];
  const today = new Date().toISOString().slice(0, 10);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
  </url>`
  )
  .join("\n")}
</urlset>`;

  response.statusCode = 200;
  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  response.end(xml);
}

async function loadMasjids(): Promise<PublicMasjid[]> {
  const supabaseUrl = cleanEnvValue(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  );
  const supabaseKey = cleanEnvValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY
  );

  if (!supabaseUrl || !supabaseKey) return [];

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase
    .from("public_masjids")
    .select("slug")
    .eq("is_active", true)
    .order("slug", { ascending: true });

  if (error) {
    console.error("[Sitemap] Could not load masjids", error.message);
    return [];
  }

  return (data ?? []) as PublicMasjid[];
}

function getRequestOrigin(request: IncomingMessage) {
  const forwardedProto = request.headers["x-forwarded-proto"];
  const forwardedHost = request.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost || request.headers.host || "ummahway.com";
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto || (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}`.replace(/\/$/, "");
}

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
