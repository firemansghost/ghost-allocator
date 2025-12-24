/**
 * Centralized URL constants for the application.
 * 
 * SITE_URL should be set via NEXT_PUBLIC_SITE_URL environment variable in production.
 * Falls back to localhost for development.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

/**
 * External URLs used throughout the application.
 * All external links should use these constants for maintainability.
 */
export const EXTERNAL_URLS = {
  SIMPLIFY: "https://www.simplify.us/",
} as const;







