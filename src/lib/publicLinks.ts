export const STORE_LINKS = {
  ios: "https://apps.apple.com/app/ummahway/id6757399317",
  android: "https://play.google.com/store/apps/details?id=com.ummahway.app",
} as const;

export const TV_APP_URL = "https://tv.ummahway.com";

export function getMasjidPath(slug: string) {
  return `/masjids/${encodeURIComponent(slug)}`;
}

export function getMasjidTvUrl() {
  return TV_APP_URL;
}
