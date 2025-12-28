/**
 * GhostRegime Flip Watch
 * Persistence guard and regime flip detection
 */

import type { RegimeType, FlipWatchStatus } from './types';
import { FLIP_WATCH } from './config';

export interface FlipWatchState {
  status: FlipWatchStatus;
  previousRegime: RegimeType | null;
  daysSinceLastFlip: number;
  daysPending: number;
}

/**
 * Detect flip watch status
 */
export function detectFlipWatch(
  currentRegime: RegimeType,
  previousRegime: RegimeType | null,
  riskScore: number,
  inflScore: number,
  daysSinceLastFlip: number
): FlipWatchStatus {
  // Check if regime changed
  const regimeChanged = previousRegime !== null && previousRegime !== currentRegime;

  if (!regimeChanged) {
    return 'NONE';
  }

  // Check for strong flip: abs(score) >= 2
  const maxScore = Math.max(Math.abs(riskScore), Math.abs(inflScore));
  if (maxScore >= FLIP_WATCH.STRONG_FLIP_SCORE_THRESHOLD) {
    return 'STRONG_FLIP';
  }

  // Check if we're in confirmation period
  if (daysSinceLastFlip <= FLIP_WATCH.CONFIRMATION_DAYS) {
    return 'PENDING_CONFIRMATION';
  }

  // Score changed but not strong enough and not confirmed
  return 'BREWING';
}

/**
 * Determine if flip should be applied
 */
export function shouldApplyFlip(
  status: FlipWatchStatus,
  daysPending: number
): boolean {
  if (status === 'STRONG_FLIP') {
    return true; // Immediate flip allowed
  }

  if (status === 'PENDING_CONFIRMATION') {
    return daysPending >= FLIP_WATCH.CONFIRMATION_DAYS;
  }

  if (status === 'BREWING') {
    return false; // Wait for confirmation
  }

  return false; // NONE
}















