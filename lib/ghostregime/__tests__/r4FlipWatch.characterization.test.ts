/**
 * R4 CHARACTERIZATION — current behavior, not desired permanent contract
 *
 * Flip Watch is telemetry/status today. These tests exercise the exported
 * helpers in isolation. They do not prove the production engine calls
 * shouldApplyFlip() (R0 found that path unused).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectFlipWatch, shouldApplyFlip } from '../flipWatch';
import { applyStressOverride } from '../regimeCore';
import { FLIP_WATCH, STRESS_OVERRIDE } from '../config';

describe('R4 CHARACTERIZATION — detectFlipWatch current helper', () => {
  it('ordinary regime change with daysSinceLastFlip <= confirmationDays is PENDING_CONFIRMATION', () => {
    assert.strictEqual(
      detectFlipWatch('INFLATION', 'REFLATION', 1, 1, 0),
      'PENDING_CONFIRMATION'
    );
    assert.strictEqual(
      detectFlipWatch('INFLATION', 'REFLATION', 1, 1, FLIP_WATCH.CONFIRMATION_DAYS),
      'PENDING_CONFIRMATION'
    );
  });

  it('negative daysSinceLastFlip satisfies the current <= confirmationDays condition', () => {
    assert.strictEqual(
      detectFlipWatch('INFLATION', 'REFLATION', 1, 1, -3313),
      'PENDING_CONFIRMATION'
    );
  });

  it('STRONG_FLIP when max(|risk|,|infl|) >= threshold', () => {
    assert.strictEqual(
      detectFlipWatch('INFLATION', 'GOLDILOCKS', 2, 0, 0),
      'STRONG_FLIP'
    );
    assert.strictEqual(
      detectFlipWatch('DEFLATION', 'GOLDILOCKS', 0, -2, 5),
      'STRONG_FLIP'
    );
  });

  it('no previous regime, or unchanged regime, is NONE', () => {
    assert.strictEqual(detectFlipWatch('INFLATION', null, 1, 1, 0), 'NONE');
    assert.strictEqual(detectFlipWatch('INFLATION', 'INFLATION', 1, 1, 0), 'NONE');
  });

  it('regime change outside confirmation window and not strong is BREWING', () => {
    assert.strictEqual(
      detectFlipWatch('INFLATION', 'REFLATION', 1, 1, FLIP_WATCH.CONFIRMATION_DAYS + 1),
      'BREWING'
    );
  });
});

describe('R4 CHARACTERIZATION — shouldApplyFlip isolation (not an engine integration test)', () => {
  it('STRONG_FLIP applies immediately', () => {
    assert.strictEqual(shouldApplyFlip('STRONG_FLIP', 0), true);
  });

  it('PENDING_CONFIRMATION applies only when daysPending >= confirmationDays', () => {
    assert.strictEqual(shouldApplyFlip('PENDING_CONFIRMATION', 0), false);
    assert.strictEqual(shouldApplyFlip('PENDING_CONFIRMATION', 1), false);
    assert.strictEqual(
      shouldApplyFlip('PENDING_CONFIRMATION', FLIP_WATCH.CONFIRMATION_DAYS),
      true
    );
  });

  it('BREWING and NONE do not apply', () => {
    assert.strictEqual(shouldApplyFlip('BREWING', 10), false);
    assert.strictEqual(shouldApplyFlip('NONE', 10), false);
  });
});

describe('Stress override characterization (current helper; does not redesign risk_axis)', () => {
  it('VIX above threshold AND HYG/IEF at/below threshold forces RISK OFF from RISK ON', () => {
    assert.strictEqual(
      applyStressOverride(
        STRESS_OVERRIDE.VIX_THRESHOLD + 0.1,
        STRESS_OVERRIDE.HYG_IEF_RATIO_THRESHOLD,
        'RISK ON'
      ),
      'RISK OFF'
    );
  });

  it('does not trigger when only one condition is met', () => {
    assert.strictEqual(
      applyStressOverride(STRESS_OVERRIDE.VIX_THRESHOLD + 1, 0, 'RISK ON'),
      'RISK ON'
    );
    assert.strictEqual(
      applyStressOverride(
        STRESS_OVERRIDE.VIX_THRESHOLD,
        STRESS_OVERRIDE.HYG_IEF_RATIO_THRESHOLD,
        'RISK ON'
      ),
      'RISK ON'
    );
  });

  it('leaves RISK OFF unchanged when triggered', () => {
    assert.strictEqual(
      applyStressOverride(40, -0.05, 'RISK OFF'),
      'RISK OFF'
    );
  });
});
