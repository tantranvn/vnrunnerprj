import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert a file URL to an absolute URL by prepending the API base URL if needed
 */
export function getMediaUrl(fileUrl: string) {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl
  }
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")
  return `${base}${fileUrl}`
}

/**
 * Format a date string with short month format (e.g., "21 Dec 2024")
 */
export function formatDate(dateStr: string | Date, locale = "en-GB"): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/**
 * Format a date string with long month format (e.g., "21 December 2024")
 */
export function formatDateLong(
  dateStr: string | Date,
  locale = "en-GB",
): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/**
 * Format a date as short uppercase format for cards (e.g., "SEP 21")
 */
export function formatShortDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    .toUpperCase()
}

/**
 * Convert a date to datetime-local input format (YYYY-MM-DDTHH:mm)
 */
export function toDateTimeLocalString(
  dateStr: string | Date | null | undefined,
): string {
  if (!dateStr) return ""
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr
  return date.toISOString().slice(0, 16)
}

/**
 * Format price with locale string and currency
 */
export function formatPrice(
  price: number | null | undefined,
  currency = "VND",
): string {
  if (price === null || price === undefined) return "—"
  return `${price.toLocaleString()} ${currency}`
}

/**
 * Convert snake_case or UPPER_CASE status to Title Case
 */
export function formatStatus(status: string | undefined): string {
  if (!status) return "Draft"
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}
