import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  
  // Use protocol-relative URL or the frontend URL from env
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}
