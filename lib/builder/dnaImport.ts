/**
 * DNA Import Parser
 * 
 * Utilities for extracting DNA tokens from user input (paste links or tokens).
 * Supports:
 * - Raw base64url tokens
 * - Partial URLs: "/onboarding?dna=TOKEN"
 * - Full URLs: "https://example.com/onboarding?dna=TOKEN"
 * 
 * Does NOT parse the human-readable DNA string format (Template=... | ...).
 * That is V2.
 */

/**
 * Checks if a string looks like a base64url token (rough heuristic)
 */
export function isLikelyBase64UrlToken(s: string): boolean {
  const trimmed = s.trim();
  // Base64url: alphanumeric, -, _, and = (padding only at end)
  // Typically 20+ chars for encoded JSON
  if (trimmed.length < 10) return false;
  const base64urlPattern = /^[A-Za-z0-9_-]+=*$/;
  return base64urlPattern.test(trimmed);
}

/**
 * Extracts the DNA token from various input formats:
 * - Raw base64url token: "eyJ2IjoxLC..."
 * - Partial URL: "/onboarding?dna=eyJ2IjoxLC..."
 * - Full URL: "https://example.com/onboarding?dna=eyJ2IjoxLC..."
 * 
 * Returns the token string (without "dna=" prefix) or null if not found.
 */
export function extractDnaParam(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  
  const trimmed = input.trim();
  if (!trimmed) return null;
  
  // Remove surrounding quotes if present
  const unquoted = trimmed.replace(/^["']|["']$/g, '');
  
  // Case 1: Looks like a raw base64url token (no "dna=" prefix)
  if (isLikelyBase64UrlToken(unquoted)) {
    return unquoted;
  }
  
  // Case 2: Contains "dna=" (URL or partial URL)
  const dnaMatch = unquoted.match(/[?&]dna=([A-Za-z0-9_-]+=*)/);
  if (dnaMatch && dnaMatch[1]) {
    return dnaMatch[1];
  }
  
  // Case 3: Try to find dna= at the start (edge case: "dna=TOKEN" without URL)
  const directMatch = unquoted.match(/^dna=([A-Za-z0-9_-]+=*)$/);
  if (directMatch && directMatch[1]) {
    return directMatch[1];
  }
  
  return null;
}

