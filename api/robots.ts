import type { IncomingMessage, ServerResponse } from "node:http";
import { setApiSecurityHeaders } from "./_security";

export default function handler(
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
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /reset-password
Disallow: /confirm-email
Disallow: /auth/confirm
Disallow: /api/

Sitemap: ${origin}/sitemap.xml
`;

  response.statusCode = 200;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  response.end(body);
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
