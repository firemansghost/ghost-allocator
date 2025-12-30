/**
 * Formats a number as a percentage string
 * @param value - Number between 0 and 1 (e.g., 0.25 for 25%)
 * @returns Formatted percentage string (e.g., "25%")
 */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}



















