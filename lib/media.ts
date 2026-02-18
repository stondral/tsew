import { logger } from './logger';

export const R2_URL = "https://5d24be3406adc0ad4610405062859db9.r2.cloudflarestorage.com"

const getSiteUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Prioritize frontend URL for internal linking, fallback to Payload URL
  const url = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
};

export const PLACEHOLDER = "/placeholder.png";

export function resolveMediaUrl(input?: unknown): string {
  const SITE_URL = getSiteUrl();
  logger.debug({ input, siteUrl: SITE_URL }, "🔍 resolveMediaUrl input");

  // 🚫 No input → no image
  if (!input) {
    return PLACEHOLDER;
  }

  // Extract URL from object or string
  let url: string;
  if (typeof input === "object" && input !== null && "url" in input && typeof (input as { url: unknown }).url === "string") {
    url = (input as { url: string }).url;
  } else if (typeof input === "string") {
    url = input;
  } else {
    return PLACEHOLDER;
  }

  // 🚨 Reject screenshot-style filenames (spaces, no path)
  if (!url.includes("/") && url.toLowerCase().includes("screenshot")) {
    return PLACEHOLDER;
  }

  url = url.trim();
  if (!url) {
    return PLACEHOLDER;
  }

  // 0️⃣ Handle localhost replacement for network access
  if (url.includes("localhost:3000") && !SITE_URL.includes("localhost")) {
    url = url.replace("http://localhost:3000", SITE_URL);
    logger.debug({ url }, "🔄 Replaced localhost with current site URL");
  }

  // 1️⃣ Absolute URLs → trust it (now potentially updated)
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  // 2️⃣ Payload API media routes → Convert to direct media URLs
  if (url.startsWith("/api/media/file/") || url.startsWith("api/media/file/")) {
    const filename = url.split("/").pop() || "";
    if (!filename) {
      return PLACEHOLDER;
    }
    const mediaUrl = `${SITE_URL}/media/${filename}`;
    logger.debug({ original: url, mediaUrl }, "🪣 Payload API route to media URL");
    return mediaUrl;
  }

  // 3️⃣ Static media routes
  if (url.startsWith("/media/")) {
    const finalUrl = `${SITE_URL}${url}`;
    logger.debug({ finalUrl }, "✅ Static media route");
    return finalUrl;
  }

  // 4️⃣ Root-relative filenames → /media/filename
  if (url.startsWith("/")) {
    const finalUrl = `${SITE_URL}/media${url}`;
    logger.debug({ finalUrl }, "✅ Root-relative filename");
    return finalUrl;
  }

  // 5️⃣ Bare filename fallback → /media/filename
  const finalUrl = `${SITE_URL}/media/${url}`;
  logger.debug({ finalUrl }, "✅ Bare filename fallback");
  return finalUrl;
}
