import { useEffect, useMemo } from "react";
import {
  Analytics,
  type BeforeSendEvent,
} from "@vercel/analytics/react";
import { matchPath, useLocation } from "react-router";
import {
  sanitizeAnalyticsValue,
  trackSiteEvent,
} from "../lib/vercelAnalytics";

type RouteSection = "public" | "legal" | "auth" | "admin";

type AnalyticsRoute = {
  pattern: string;
  route: string;
  section: RouteSection;
};

const ANALYTICS_ROUTES: AnalyticsRoute[] = [
  { pattern: "/", route: "/", section: "public" },
  { pattern: "/masjids", route: "/masjids", section: "public" },
  { pattern: "/masjids/:slug", route: "/masjids/[slug]", section: "public" },
  {
    pattern: "/list-your-masjid",
    route: "/list-your-masjid",
    section: "public",
  },
  { pattern: "/tv", route: "/tv", section: "public" },
  { pattern: "/contact", route: "/contact", section: "public" },
  { pattern: "/confirm-email", route: "/confirm-email", section: "auth" },
  { pattern: "/auth/confirm", route: "/auth/confirm", section: "auth" },
  { pattern: "/privacy", route: "/privacy", section: "legal" },
  { pattern: "/terms", route: "/terms", section: "legal" },
  { pattern: "/login", route: "/login", section: "auth" },
  { pattern: "/reset-password", route: "/reset-password", section: "auth" },
  { pattern: "/admin", route: "/admin", section: "admin" },
];

const SAFE_QUERY_PARAMETERS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);

export function VercelAnalytics() {
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);
  const routeInfo = useMemo(() => resolveAnalyticsRoute(pathname), [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const explicitTarget = closestElement<HTMLElement>(
        event.target,
        "[data-analytics-event]"
      );

      if (explicitTarget && explicitTarget.tagName !== "FORM") {
        const eventName = explicitTarget.dataset.analyticsEvent?.trim();
        if (!eventName) return;

        trackSiteEvent(eventName, {
          ...routeContext(routeInfo, pathname),
          label: sanitizeAnalyticsValue(explicitTarget.dataset.analyticsLabel),
        });
        return;
      }

      const anchor = closestElement<HTMLAnchorElement>(event.target, "a[href]");
      if (!anchor || anchor.dataset.analyticsIgnore === "true") return;

      const destination = getLinkDestination(anchor);
      if (!destination) return;

      trackSiteEvent("Link Clicked", {
        ...routeContext(routeInfo, pathname),
        ...destination,
        label: sanitizeAnalyticsValue(anchor.dataset.analyticsLabel),
        target_blank: anchor.target === "_blank",
      });
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = closestElement<HTMLFormElement>(
        event.target,
        "form[data-analytics-event]"
      );
      const eventName = form?.dataset.analyticsEvent?.trim();
      if (!form || !eventName) return;

      trackSiteEvent(eventName, {
        ...routeContext(routeInfo, pathname),
        label: sanitizeAnalyticsValue(form.dataset.analyticsLabel),
      });
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("submit", handleSubmit);
    };
  }, [pathname, routeInfo]);

  return (
    <Analytics
      beforeSend={sanitizeAnalyticsEventUrl}
      path={pathname}
      route={routeInfo.route}
    />
  );
}

function sanitizeAnalyticsEventUrl(event: BeforeSendEvent): BeforeSendEvent {
  if (typeof window === "undefined") return event;

  try {
    const url = new URL(event.url, window.location.origin);
    const sanitizedUrl = new URL(`${url.origin}${normalizePathname(url.pathname)}`);

    url.searchParams.forEach((value, key) => {
      const safeKey = key.toLowerCase();
      if (SAFE_QUERY_PARAMETERS.has(safeKey)) {
        sanitizedUrl.searchParams.append(safeKey, sanitizeAnalyticsValue(value));
      }
    });

    return { ...event, url: sanitizedUrl.toString() };
  } catch {
    return event;
  }
}

function resolveAnalyticsRoute(pathname: string) {
  return (
    ANALYTICS_ROUTES.find((item) =>
      matchPath({ path: item.pattern, end: true }, pathname)
    ) ?? {
      pattern: pathname,
      route: pathname,
      section: "public" as const,
    }
  );
}

function routeContext(routeInfo: AnalyticsRoute, pathname: string) {
  return {
    route: routeInfo.route,
    path: pathname,
    section: routeInfo.section,
  };
}

function getLinkDestination(anchor: HTMLAnchorElement) {
  const rawHref = anchor.getAttribute("href")?.trim();
  if (!rawHref || rawHref.toLowerCase().startsWith("javascript:")) return null;

  try {
    const url = new URL(anchor.href, window.location.href);

    if (url.protocol === "mailto:") {
      return { destination_type: "email", destination: "mailto" };
    }

    if (url.protocol === "tel:") {
      return { destination_type: "phone", destination: "tel" };
    }

    const isInternal = url.origin === window.location.origin;
    const normalizedPath = normalizePathname(url.pathname);
    const destination = isInternal
      ? normalizedPath
      : `${url.hostname}${normalizedPath}`;

    return {
      destination_type: isInternal ? "internal" : "external",
      destination: sanitizeAnalyticsValue(destination),
      has_hash: Boolean(url.hash),
    };
  } catch {
    return null;
  }
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function closestElement<T extends Element>(
  target: EventTarget | null,
  selector: string
) {
  if (!(target instanceof Element)) return null;
  return target.closest(selector) as T | null;
}
