/**
 * GhostFlow offline refresh planner — deterministic scenario tests.
 */

import assert from 'assert';
import { buildGhostFlowRefreshReport } from '../refresh/planner';
import { GATE_C_CANDIDATE_GROUP_ID } from '../refresh/registry';
import type { GhostFlowArtifactRefreshAttempt } from '../refresh/report';
import {
  PLANNER_GENERATED_AT,
  candidateAttempt,
  currentArtifactSummary,
  manualInputAttempt,
  noNewerAttempt,
  notAttemptedAttempt,
  sourceFailedAttempt,
} from './fixtures/refreshPlannerFixtures';

function assertFailCode(
  result: ReturnType<typeof buildGhostFlowRefreshReport>,
  code: string
): void {
  assert.strictEqual(result.ok, false);
  if (result.ok) return;
  assert.ok(
    result.issues.some((i) => i.code === code),
    `expected issue code ${code}; got ${result.issues.map((i) => i.code).join(', ')}`
  );
}

function assertOk(
  result: ReturnType<typeof buildGhostFlowRefreshReport>
): asserts result is Extract<ReturnType<typeof buildGhostFlowRefreshReport>, { ok: true }> {
  assert.strictEqual(result.ok, true, result.ok ? '' : JSON.stringify(result.issues));
}

// --- Input validation (1–10) ---

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'etfNetIssuance'],
    attempts: [noNewerAttempt('etfNetIssuance'), noNewerAttempt('etfNetIssuance')],
  });
  assertFailCode(result, 'duplicate_requested_artifact_id');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance'],
    attempts: [noNewerAttempt('etfNetIssuance'), sourceFailedAttempt('etfNetIssuance')],
  });
  assertFailCode(result, 'duplicate_attempt_artifact_id');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['notARealArtifact' as never],
    attempts: [
      {
        artifactId: 'notARealArtifact' as never,
        status: 'no_newer_observation',
        current: {
          artifactId: 'notARealArtifact' as never,
          artifactPath: 'data/ghostflow/artifacts/missing.v1.json',
        },
        issues: [],
      },
    ],
  });
  assertFailCode(result, 'unknown_artifact_id');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'indexConcentration'],
    attempts: [noNewerAttempt('etfNetIssuance')],
  });
  assertFailCode(result, 'missing_attempt');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance'],
    attempts: [noNewerAttempt('etfNetIssuance'), noNewerAttempt('indexConcentration')],
  });
  assertFailCode(result, 'unrequested_attempt');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance'],
    attempts: [
      noNewerAttempt('etfNetIssuance', {
        artifactPath: 'data/ghostflow/artifacts/wrong.v1.json',
      }),
    ],
  });
  assertFailCode(result, 'current_artifact_path_mismatch');
}

{
  const bad = {
    artifactId: 'etfNetIssuance',
    status: 'candidate_observation_available',
    current: currentArtifactSummary('etfNetIssuance'),
    issues: [],
  } as GhostFlowArtifactRefreshAttempt;
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance'],
    attempts: [bad],
  });
  assertFailCode(result, 'candidate_summary_required');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance'],
    attempts: [candidateAttempt('etfNetIssuance', '07-09-2026')],
  });
  assertFailCode(result, 'invalid_candidate_observation_as_of');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance'],
    attempts: [candidateAttempt('etfNetIssuance', '2026-07-09', { contentSha256: '   ' })],
  });
  assertFailCode(result, 'empty_candidate_content_hash');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['volatilityRegime'],
    attempts: [candidateAttempt('volatilityRegime', '2026-07-09')],
  });
  assertFailCode(result, 'gate_c_selection_incomplete');
}

// --- Gate C (11–16) ---

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['marketBreadth', 'volatilityRegime'],
    attempts: [
      candidateAttempt('marketBreadth', '2026-07-09'),
      candidateAttempt('volatilityRegime', '2026-07-09'),
    ],
  });
  assertOk(result);
  const report = result.value;
  assert.strictEqual(report.candidateGroups.length, 1);
  const group = report.candidateGroups[0]!;
  assert.strictEqual(group.candidateGroupId, GATE_C_CANDIDATE_GROUP_ID);
  assert.strictEqual(group.status, 'ready_for_review');
  assert.deepStrictEqual(group.artifactIds, ['volatilityRegime', 'marketBreadth']);
  assert.deepStrictEqual(group.observationAsOfValues, ['2026-07-09', '2026-07-09']);
  assert.strictEqual(report.overallStatus, 'ready_for_review');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['volatilityRegime', 'marketBreadth'],
    attempts: [noNewerAttempt('volatilityRegime'), noNewerAttempt('marketBreadth')],
  });
  assertOk(result);
  assert.strictEqual(result.value.candidateGroups[0]!.status, 'no_change');
  assert.strictEqual(result.value.overallStatus, 'no_changes');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['volatilityRegime', 'marketBreadth'],
    attempts: [
      candidateAttempt('volatilityRegime', '2026-07-09'),
      noNewerAttempt('marketBreadth'),
    ],
  });
  assertOk(result);
  const group = result.value.candidateGroups[0]!;
  assert.strictEqual(group.status, 'blocked');
  assert.ok(group.issues.some((i) => i.code === 'candidate_group_incomplete'));
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['volatilityRegime', 'marketBreadth'],
    attempts: [
      candidateAttempt('volatilityRegime', '2026-07-09'),
      sourceFailedAttempt('marketBreadth'),
    ],
  });
  assertOk(result);
  const group = result.value.candidateGroups[0]!;
  assert.strictEqual(group.status, 'blocked');
  assert.ok(group.issues.some((i) => i.code === 'candidate_group_incomplete'));
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['volatilityRegime', 'marketBreadth'],
    attempts: [
      candidateAttempt('volatilityRegime', '2026-07-08'),
      candidateAttempt('marketBreadth', '2026-07-09'),
    ],
  });
  assertOk(result);
  const group = result.value.candidateGroups[0]!;
  assert.strictEqual(group.status, 'blocked');
  assert.ok(group.issues.some((i) => i.code === 'candidate_group_observation_mismatch'));
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['marketBreadth', 'volatilityRegime'],
    attempts: [
      candidateAttempt('marketBreadth', '2026-07-09'),
      candidateAttempt('volatilityRegime', '2026-07-09'),
    ],
  });
  assertOk(result);
  assert.deepStrictEqual(result.value.requestedArtifactIds, [
    'volatilityRegime',
    'marketBreadth',
  ]);
  assert.deepStrictEqual(result.value.artifactAttempts.map((a) => a.artifactId), [
    'volatilityRegime',
    'marketBreadth',
  ]);
  assert.deepStrictEqual(result.value.candidateGroups[0]!.artifactIds, [
    'volatilityRegime',
    'marketBreadth',
  ]);
}

// --- Isolated score-fed (17–19) ---

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'indexConcentration'],
    attempts: [
      candidateAttempt('etfNetIssuance', '2026-07-08'),
      sourceFailedAttempt('indexConcentration'),
    ],
  });
  assertOk(result);
  const etf = result.value.candidateGroups.find((g) =>
    g.artifactIds.includes('etfNetIssuance')
  )!;
  const conc = result.value.candidateGroups.find((g) =>
    g.artifactIds.includes('indexConcentration')
  )!;
  assert.strictEqual(etf.status, 'ready_for_review');
  assert.strictEqual(conc.status, 'blocked');
  assert.notStrictEqual(etf.candidateGroupId, conc.candidateGroupId);
  assert.strictEqual(result.value.overallStatus, 'partial_with_blocks');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'passiveShareProxy'],
    attempts: [
      sourceFailedAttempt('etfNetIssuance'),
      candidateAttempt('passiveShareProxy', '2026-05-31'),
    ],
  });
  assertOk(result);
  const etf = result.value.candidateGroups.find((g) =>
    g.artifactIds.includes('etfNetIssuance')
  )!;
  const ici = result.value.candidateGroups.find((g) =>
    g.artifactIds.includes('passiveShareProxy')
  )!;
  assert.strictEqual(etf.status, 'blocked');
  assert.strictEqual(ici.status, 'ready_for_review');
  assert.notStrictEqual(etf.candidateGroupId, ici.candidateGroupId);
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'passiveShareProxy', 'activeIndexFlow'],
    attempts: [
      candidateAttempt('etfNetIssuance', '2026-07-08'),
      candidateAttempt('passiveShareProxy', '2026-05-31'),
      candidateAttempt('activeIndexFlow', '2026-05-31'),
    ],
  });
  assertOk(result);
  const groupIds = result.value.candidateGroups.map((g) => g.candidateGroupId);
  assert.strictEqual(new Set(groupIds).size, 3);
}

// --- Display and Treasury boundaries (20–23) ---

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'systematicFlowProxy'],
    attempts: [
      candidateAttempt('etfNetIssuance', '2026-07-08'),
      sourceFailedAttempt('systematicFlowProxy'),
    ],
  });
  assertOk(result);
  const etf = result.value.candidateGroups.find((g) =>
    g.artifactIds.includes('etfNetIssuance')
  )!;
  const cftc = result.value.candidateGroups.find((g) =>
    g.artifactIds.includes('systematicFlowProxy')
  )!;
  assert.strictEqual(etf.status, 'ready_for_review');
  assert.strictEqual(etf.primaryLane, 'score_fed_equity');
  assert.strictEqual(cftc.status, 'blocked');
  assert.strictEqual(cftc.primaryLane, 'display_only_equity');
  assert.deepStrictEqual([...cftc.failureSeverities], ['nonfatal_display']);
  assert.strictEqual(result.value.overallStatus, 'partial_with_blocks');
  assert.strictEqual(
    result.value.suggestedAction,
    'review_candidates_and_investigate_blocks'
  );
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'treasuryLongEndIncomeLens'],
    attempts: [
      candidateAttempt('etfNetIssuance', '2026-07-08'),
      sourceFailedAttempt('treasuryLongEndIncomeLens'),
    ],
  });
  assertOk(result);
  const treasury = result.value.candidateGroups.find((g) =>
    g.artifactIds.includes('treasuryLongEndIncomeLens')
  )!;
  assert.strictEqual(treasury.status, 'blocked');
  assert.deepStrictEqual([...treasury.failureSeverities], ['nonfatal_treasury']);
  assert.strictEqual(result.value.overallStatus, 'partial_with_blocks');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['treasuryFuturesPositioningProxy'],
    attempts: [candidateAttempt('treasuryFuturesPositioningProxy', '2026-06-30')],
  });
  assertOk(result);
  const group = result.value.candidateGroups[0]!;
  assert.strictEqual(group.status, 'ready_for_review');
  assert.strictEqual(group.primaryLane, 'treasury_display');
  assert.ok(!('scoreInputs' in group));
  assert.strictEqual(result.value.summary.treasuryReadyGroupCount, 1);
  assert.strictEqual(result.value.summary.scoreFedReadyGroupCount, 0);
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['optionsActivityProxy'],
    attempts: [candidateAttempt('optionsActivityProxy', '2026-07-09')],
  });
  assertOk(result);
  const group = result.value.candidateGroups[0]!;
  assert.strictEqual(group.status, 'ready_for_review');
  assert.strictEqual(group.primaryLane, 'display_only_equity');
  assert.strictEqual(result.value.summary.displayOnlyReadyGroupCount, 1);
  assert.strictEqual(result.value.summary.scoreFedReadyGroupCount, 0);
}

// --- Overall status (24–27) ---

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'indexConcentration'],
    attempts: [noNewerAttempt('etfNetIssuance'), noNewerAttempt('indexConcentration')],
  });
  assertOk(result);
  assert.strictEqual(result.value.overallStatus, 'no_changes');
  assert.strictEqual(result.value.suggestedAction, 'no_action');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'passiveShareProxy'],
    attempts: [
      candidateAttempt('etfNetIssuance', '2026-07-08'),
      candidateAttempt('passiveShareProxy', '2026-05-31'),
    ],
  });
  assertOk(result);
  assert.strictEqual(result.value.overallStatus, 'ready_for_review');
  assert.strictEqual(result.value.suggestedAction, 'review_candidates');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'indexConcentration'],
    attempts: [
      candidateAttempt('etfNetIssuance', '2026-07-08'),
      sourceFailedAttempt('indexConcentration'),
    ],
  });
  assertOk(result);
  assert.strictEqual(result.value.overallStatus, 'partial_with_blocks');
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'systematicFlowProxy'],
    attempts: [
      sourceFailedAttempt('etfNetIssuance'),
      manualInputAttempt('systematicFlowProxy'),
    ],
  });
  assertOk(result);
  assert.strictEqual(result.value.overallStatus, 'blocked');
  assert.strictEqual(result.value.suggestedAction, 'investigate_blocks');
}

// --- Determinism and safety (28–33) ---

{
  const input = {
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'indexConcentration'] as const,
    attempts: [
      candidateAttempt('etfNetIssuance', '2026-07-08'),
      sourceFailedAttempt('indexConcentration'),
    ],
  };
  const a = buildGhostFlowRefreshReport(input);
  const b = buildGhostFlowRefreshReport(input);
  assertOk(a);
  assertOk(b);
  assert.deepStrictEqual(a.value, b.value);
}

{
  const forward = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'indexConcentration'],
    attempts: [
      candidateAttempt('etfNetIssuance', '2026-07-08'),
      noNewerAttempt('indexConcentration'),
    ],
  });
  const reversed = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['indexConcentration', 'etfNetIssuance'],
    attempts: [
      noNewerAttempt('indexConcentration'),
      candidateAttempt('etfNetIssuance', '2026-07-08'),
    ],
  });
  assertOk(forward);
  assertOk(reversed);
  assert.deepStrictEqual(forward.value.candidateGroups, reversed.value.candidateGroups);
  assert.deepStrictEqual(
    forward.value.artifactAttempts.map((x) => x.artifactId),
    reversed.value.artifactAttempts.map((x) => x.artifactId)
  );
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance', 'systematicFlowProxy'],
    attempts: [
      candidateAttempt('etfNetIssuance', '2026-07-08'),
      sourceFailedAttempt('systematicFlowProxy'),
    ],
  });
  assertOk(result);
  const serialized = JSON.stringify(result.value).toLowerCase();
  for (const forbidden of [
    'localpath',
    'tmppath',
    'workspacepath',
    'rawbody',
    'apikey',
    'token',
    'cookie',
    'automerge',
    'autoapprove',
    'writeproduction',
  ]) {
    assert.ok(!serialized.includes(forbidden), `report must not contain ${forbidden}`);
  }
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: [
      'etfNetIssuance',
      'indexConcentration',
      'systematicFlowProxy',
      'treasuryLongEndIncomeLens',
    ],
    attempts: [
      candidateAttempt('etfNetIssuance', '2026-07-08'),
      sourceFailedAttempt('indexConcentration'),
      noNewerAttempt('systematicFlowProxy'),
      candidateAttempt('treasuryLongEndIncomeLens', '2026-07-09'),
    ],
  });
  assertOk(result);
  const { summary, candidateGroups } = result.value;
  assert.strictEqual(summary.selectedGroupCount, candidateGroups.length);
  assert.strictEqual(
    summary.readyGroupCount,
    candidateGroups.filter((g) => g.status === 'ready_for_review').length
  );
  assert.strictEqual(
    summary.blockedGroupCount,
    candidateGroups.filter((g) => g.status === 'blocked').length
  );
  assert.strictEqual(
    summary.noChangeGroupCount,
    candidateGroups.filter((g) => g.status === 'no_change').length
  );
  assert.strictEqual(
    summary.scoreFedReadyGroupCount +
      summary.displayOnlyReadyGroupCount +
      summary.treasuryReadyGroupCount,
    summary.readyGroupCount
  );
}

{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance'],
    attempts: [candidateAttempt('etfNetIssuance', '2026-07-08')],
  });
  assertOk(result);
  assert.strictEqual(result.value.mode, 'report_only');
  assert.strictEqual(result.value.requiresHumanReview, true);
  assert.notStrictEqual(result.value.mode, 'automated');
  assert.notStrictEqual(result.value.mode, 'production');
}

// Extra: not_attempted blocks artifact groups; Gate C manual without failure
{
  const result = buildGhostFlowRefreshReport({
    generatedAt: PLANNER_GENERATED_AT,
    requestedArtifactIds: ['etfNetIssuance'],
    attempts: [notAttemptedAttempt('etfNetIssuance')],
  });
  assertOk(result);
  assert.strictEqual(result.value.candidateGroups[0]!.status, 'blocked');
  assert.strictEqual(result.value.overallStatus, 'blocked');
}

console.log('ghostflow/refreshPlanner.test.ts: ok');
