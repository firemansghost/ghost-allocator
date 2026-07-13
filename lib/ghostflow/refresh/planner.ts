/**
 * GhostFlow offline refresh planner — pure, deterministic, report-only.
 * No I/O, network, env, clocks, randomness, scoring, or production writes.
 */

import {
  GATE_C_ARTIFACT_IDS,
  GATE_C_CANDIDATE_GROUP_ID,
  GHOSTFLOW_REFRESH_REGISTRY,
  type GhostFlowRegisteredArtifactId,
} from './registry';
import {
  GHOSTFLOW_REFRESH_REPORT_MODE,
  GHOSTFLOW_REFRESH_REPORT_VERSION,
  type GhostFlowArtifactRefreshAttempt,
  type GhostFlowCandidateGroupReport,
  type GhostFlowCandidateGroupStatus,
  type GhostFlowRefreshPlannerInput,
  type GhostFlowRefreshReport,
  type GhostFlowRefreshReportStatus,
  type GhostFlowRefreshSuggestedAction,
} from './report';
import type {
  GhostFlowRefreshIssue,
  GhostFlowRefreshRegistryEntry,
  GhostFlowStageResult,
} from './types';

const ISO_DATE_SHAPE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_SHAPE_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const SHA256_HEX_RE = /^[0-9a-fA-F]{64}$/;

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function reconcileIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'reconcile', code, severity: 'block', message };
}

/** Pure calendar-date check: YYYY-MM-DD shape and real UTC calendar day. */
export function isValidCalendarDate(value: string): boolean {
  if (!ISO_DATE_SHAPE_RE.test(value)) return false;
  const [ys, ms, ds] = value.split('-');
  const year = Number(ys);
  const month = Number(ms);
  const day = Number(ds);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

/** Pure ISO timestamp check: expected shape and finite Date.parse. */
export function isValidIsoTimestamp(value: string): boolean {
  if (!ISO_TIMESTAMP_SHAPE_RE.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

export function isValidSha256Hex(value: string): boolean {
  return SHA256_HEX_RE.test(value);
}

function isRegisteredArtifactId(
  id: string,
  registryById: ReadonlyMap<string, GhostFlowRefreshRegistryEntry>
): id is GhostFlowRegisteredArtifactId {
  return registryById.has(id);
}

function validatePlannerInput(
  input: GhostFlowRefreshPlannerInput,
  registry: readonly GhostFlowRefreshRegistryEntry[],
  registryById: ReadonlyMap<string, GhostFlowRefreshRegistryEntry>
): GhostFlowRefreshIssue[] {
  const issues: GhostFlowRefreshIssue[] = [];

  if (!isValidIsoTimestamp(input.generatedAt)) {
    issues.push(
      blockIssue(
        'invalid_generated_at',
        `generatedAt must be a valid ISO timestamp; got "${input.generatedAt}"`
      )
    );
  }

  const requested = input.requestedArtifactIds;
  if (requested.length === 0) {
    issues.push(
      blockIssue('no_artifacts_requested', 'Planner input must request at least one artifact')
    );
  }

  const seenRequested = new Set<string>();
  for (const id of requested) {
    if (seenRequested.has(id)) {
      issues.push(
        blockIssue('duplicate_requested_artifact_id', `Duplicate requested artifactId: ${id}`)
      );
    }
    seenRequested.add(id);
    if (!isRegisteredArtifactId(id, registryById)) {
      issues.push(blockIssue('unknown_artifact_id', `Unknown artifactId: ${id}`));
    }
  }

  // Gate C-specific closure (more specific code for the current daily pair).
  const gateCRequested = GATE_C_ARTIFACT_IDS.filter((id) => seenRequested.has(id));
  if (gateCRequested.length === 1) {
    issues.push(
      blockIssue(
        'gate_c_selection_incomplete',
        `Gate C selection requires both ${GATE_C_ARTIFACT_IDS.join(' and ')}; only ${gateCRequested[0]} was requested`
      )
    );
  }

  // Generic candidate-group selection closure for any atomic group (skips Gate C
  // after the specific check to avoid duplicate issues).
  const checkedGroupIds = new Set<string>();
  for (const id of requested) {
    const entry = registryById.get(id);
    if (!entry || entry.acceptanceUnit !== 'candidate_group') continue;
    if (checkedGroupIds.has(entry.candidateGroupId)) continue;
    checkedGroupIds.add(entry.candidateGroupId);

    if (entry.candidateGroupId === GATE_C_CANDIDATE_GROUP_ID) {
      continue;
    }

    const members = registry.filter((e) => e.candidateGroupId === entry.candidateGroupId);
    const memberIds = members.map((m) => m.artifactId);
    const missing = memberIds.filter((mid) => !seenRequested.has(mid));
    if (missing.length > 0) {
      const requestedMembers = memberIds.filter((mid) => seenRequested.has(mid));
      issues.push(
        blockIssue(
          'candidate_group_selection_incomplete',
          `Candidate group ${entry.candidateGroupId} selection incomplete; requested=[${requestedMembers.join(', ')}] missing=[${missing.join(', ')}]`
        )
      );
    }
  }

  const attempts = input.attempts;
  const seenAttempts = new Set<string>();
  const attemptById = new Map<string, GhostFlowArtifactRefreshAttempt>();

  for (const attempt of attempts) {
    if (seenAttempts.has(attempt.artifactId)) {
      issues.push(
        blockIssue(
          'duplicate_attempt_artifact_id',
          `Duplicate attempt artifactId: ${attempt.artifactId}`
        )
      );
    }
    seenAttempts.add(attempt.artifactId);
    attemptById.set(attempt.artifactId, attempt);

    if (!seenRequested.has(attempt.artifactId)) {
      issues.push(
        blockIssue(
          'unrequested_attempt',
          `Attempt for unrequested artifactId: ${attempt.artifactId}`
        )
      );
    }

    if (attempt.current.artifactId !== attempt.artifactId) {
      issues.push(
        blockIssue(
          'current_artifact_id_mismatch',
          `Attempt ${attempt.artifactId} current.artifactId is ${attempt.current.artifactId}`
        )
      );
    }

    const entry = registryById.get(attempt.artifactId);
    if (entry && attempt.current.artifactPath !== entry.artifactPath) {
      issues.push(
        blockIssue(
          'current_artifact_path_mismatch',
          `Attempt ${attempt.artifactId} current.artifactPath "${attempt.current.artifactPath}" does not match registry path "${entry.artifactPath}"`
        )
      );
    }

    if (
      attempt.current.observationAsOf !== undefined &&
      !isValidCalendarDate(attempt.current.observationAsOf)
    ) {
      issues.push(
        blockIssue(
          'invalid_current_observation_as_of',
          `Attempt ${attempt.artifactId} current.observationAsOf must be a real YYYY-MM-DD calendar date`
        )
      );
    }
    if (
      attempt.current.sourcePublishedAt !== undefined &&
      !isValidCalendarDate(attempt.current.sourcePublishedAt)
    ) {
      issues.push(
        blockIssue(
          'invalid_current_source_published_at',
          `Attempt ${attempt.artifactId} current.sourcePublishedAt must be a real YYYY-MM-DD calendar date`
        )
      );
    }

    const blockIssues = attempt.issues.filter((i) => i.severity === 'block');
    const explanatoryIssues = attempt.issues.filter(
      (i) => i.severity === 'block' || i.severity === 'review'
    );

    if (
      (attempt.status === 'candidate_observation_available' ||
        attempt.status === 'no_newer_observation') &&
      blockIssues.length > 0
    ) {
      issues.push(
        blockIssue(
          'attempt_status_block_issue_conflict',
          `Attempt ${attempt.artifactId} status ${attempt.status} cannot include block issue ${blockIssues[0]!.code}`
        )
      );
    }

    if (attempt.status === 'source_failed' && blockIssues.length === 0) {
      issues.push(
        blockIssue(
          'source_failed_missing_block_issue',
          `Attempt ${attempt.artifactId} status source_failed requires at least one severity:block issue`
        )
      );
    }

    if (attempt.status === 'manual_input_required' && explanatoryIssues.length === 0) {
      issues.push(
        blockIssue(
          'manual_input_missing_issue',
          `Attempt ${attempt.artifactId} status manual_input_required requires at least one review or block issue`
        )
      );
    }

    if (attempt.status === 'candidate_observation_available') {
      const candidate = (attempt as { candidate?: typeof attempt.candidate }).candidate;
      if (!candidate) {
        issues.push(
          blockIssue(
            'candidate_summary_required',
            `Attempt ${attempt.artifactId} has candidate_observation_available without candidate summary`
          )
        );
      } else {
        if (!isValidCalendarDate(candidate.observationAsOf)) {
          issues.push(
            blockIssue(
              'invalid_candidate_observation_as_of',
              `Attempt ${attempt.artifactId} candidate.observationAsOf must be a real YYYY-MM-DD calendar date`
            )
          );
        }
        if (
          candidate.sourcePublishedAt !== undefined &&
          !isValidCalendarDate(candidate.sourcePublishedAt)
        ) {
          issues.push(
            blockIssue(
              'invalid_candidate_source_published_at',
              `Attempt ${attempt.artifactId} candidate.sourcePublishedAt must be a real YYYY-MM-DD calendar date`
            )
          );
        }
        if (!isValidIsoTimestamp(candidate.retrievedAt)) {
          issues.push(
            blockIssue(
              'invalid_candidate_retrieved_at',
              `Attempt ${attempt.artifactId} candidate.retrievedAt must be a valid ISO timestamp`
            )
          );
        }
        if (!candidate.contentSha256.trim()) {
          issues.push(
            blockIssue(
              'empty_candidate_content_hash',
              `Attempt ${attempt.artifactId} candidate.contentSha256 must be nonempty`
            )
          );
        } else if (!isValidSha256Hex(candidate.contentSha256)) {
          issues.push(
            blockIssue(
              'invalid_candidate_content_sha256',
              `Attempt ${attempt.artifactId} candidate.contentSha256 must be 64 hexadecimal characters`
            )
          );
        }
        if (!candidate.adapterId.trim()) {
          issues.push(
            blockIssue(
              'empty_candidate_adapter_id',
              `Attempt ${attempt.artifactId} candidate.adapterId must be nonempty`
            )
          );
        } else if (entry && candidate.adapterId !== entry.adapter.adapterId) {
          issues.push(
            blockIssue(
              'candidate_adapter_id_mismatch',
              `Attempt ${attempt.artifactId} candidate.adapterId "${candidate.adapterId}" does not match registry adapterId "${entry.adapter.adapterId}"`
            )
          );
        }
        if (!candidate.parserVersion.trim()) {
          issues.push(
            blockIssue(
              'empty_candidate_parser_version',
              `Attempt ${attempt.artifactId} candidate.parserVersion must be nonempty`
            )
          );
        }
      }
    } else if (
      'candidate' in attempt &&
      (attempt as { candidate?: unknown }).candidate !== undefined
    ) {
      issues.push(
        blockIssue(
          'unexpected_candidate_summary',
          `Attempt ${attempt.artifactId} status ${attempt.status} must not include candidate summary`
        )
      );
    }
  }

  for (const id of requested) {
    if (!attemptById.has(id)) {
      issues.push(
        blockIssue('missing_attempt', `Requested artifact ${id} is missing an attempt`)
      );
    }
  }

  return issues;
}

function resolveArtifactGroupStatus(
  attempt: GhostFlowArtifactRefreshAttempt
): GhostFlowCandidateGroupStatus {
  switch (attempt.status) {
    case 'candidate_observation_available':
      return 'ready_for_review';
    case 'no_newer_observation':
      return 'no_change';
    case 'manual_input_required':
      return 'manual_input_required';
    case 'source_failed':
    case 'not_attempted':
      return 'blocked';
  }
}

function resolveCandidateGroup(
  groupId: string,
  members: readonly GhostFlowRefreshRegistryEntry[],
  attemptById: ReadonlyMap<string, GhostFlowArtifactRefreshAttempt>
): GhostFlowCandidateGroupReport | null {
  if (members.length === 0) {
    return null;
  }

  const primary = members[0];
  if (!primary) {
    return null;
  }

  const artifactIds: GhostFlowRegisteredArtifactId[] = [];
  const attempts: GhostFlowArtifactRefreshAttempt[] = [];
  for (const member of members) {
    const attempt = attemptById.get(member.artifactId);
    if (!attempt) {
      return null;
    }
    artifactIds.push(member.artifactId as GhostFlowRegisteredArtifactId);
    attempts.push(attempt);
  }

  const lanes = [...new Set(members.map((m) => m.lane))];
  const primaryLane = primary.lane;
  const failureSeverities = [
    ...new Set(members.map((m) => m.failureSeverity)),
  ] as GhostFlowCandidateGroupReport['failureSeverities'];

  const observationAsOfValues = attempts
    .filter(
      (a): a is Extract<GhostFlowArtifactRefreshAttempt, { status: 'candidate_observation_available' }> =>
        a.status === 'candidate_observation_available' && a.candidate !== undefined
    )
    .map((a) => a.candidate.observationAsOf);

  const issues: GhostFlowRefreshIssue[] = [];
  let status: GhostFlowCandidateGroupStatus;

  if (primary.acceptanceUnit === 'artifact') {
    const attempt = attempts[0];
    if (!attempt) {
      return null;
    }
    status = resolveArtifactGroupStatus(attempt);
    issues.push(...attempt.issues);
    if (attempt.status === 'not_attempted') {
      issues.push(
        reconcileIssue(
          'artifact_not_attempted',
          `Artifact ${attempt.artifactId} was selected but not attempted`
        )
      );
    }
  } else {
    // candidate_group (Gate C and any future multi-member groups)
    const statuses = new Set(attempts.map((a) => a.status));
    const allCandidate = attempts.every((a) => a.status === 'candidate_observation_available');
    const allNoNewer = attempts.every((a) => a.status === 'no_newer_observation');
    const anyCandidate = attempts.some((a) => a.status === 'candidate_observation_available');
    const anyFailed = attempts.some((a) => a.status === 'source_failed');
    const anyNotAttempted = attempts.some((a) => a.status === 'not_attempted');
    const anyManual = attempts.some((a) => a.status === 'manual_input_required');

    if (allCandidate) {
      const uniqueAsOf = new Set(observationAsOfValues);
      if (uniqueAsOf.size === 1) {
        status = 'ready_for_review';
      } else {
        status = 'blocked';
        issues.push(
          reconcileIssue(
            'candidate_group_observation_mismatch',
            `Candidate group ${groupId} has mismatched observationAsOf values: ${[...uniqueAsOf].join(', ')}`
          )
        );
      }
    } else if (allNoNewer) {
      status = 'no_change';
    } else if (anyCandidate) {
      status = 'blocked';
      issues.push(
        reconcileIssue(
          'candidate_group_incomplete',
          `Candidate group ${groupId} has a partial candidate set; all members must share a candidate for the same session`
        )
      );
    } else if (anyFailed || anyNotAttempted) {
      status = 'blocked';
      if (anyNotAttempted && !anyFailed) {
        issues.push(
          reconcileIssue(
            'candidate_group_not_attempted',
            `Candidate group ${groupId} includes not_attempted members`
          )
        );
      }
    } else if (anyManual && !statuses.has('source_failed') && !statuses.has('not_attempted')) {
      status = 'manual_input_required';
    } else {
      status = 'blocked';
    }

    for (const attempt of attempts) {
      issues.push(...attempt.issues);
    }
  }

  return {
    candidateGroupId: groupId,
    acceptanceUnit: primary.acceptanceUnit,
    artifactIds,
    lanes,
    primaryLane,
    status,
    failureSeverities,
    observationAsOfValues,
    issues,
  };
}

function computeOverallStatus(
  groups: readonly GhostFlowCandidateGroupReport[]
): {
  overallStatus: GhostFlowRefreshReportStatus;
  suggestedAction: GhostFlowRefreshSuggestedAction;
} {
  const ready = groups.filter((g) => g.status === 'ready_for_review').length;
  const blockedOrManual = groups.filter(
    (g) => g.status === 'blocked' || g.status === 'manual_input_required'
  ).length;
  const noChange = groups.filter((g) => g.status === 'no_change').length;

  if (ready > 0 && blockedOrManual === 0) {
    return {
      overallStatus: 'ready_for_review',
      suggestedAction: 'review_candidates',
    };
  }
  if (ready > 0 && blockedOrManual > 0) {
    return {
      overallStatus: 'partial_with_blocks',
      suggestedAction: 'review_candidates_and_investigate_blocks',
    };
  }
  if (ready === 0 && blockedOrManual > 0) {
    return {
      overallStatus: 'blocked',
      suggestedAction: 'investigate_blocks',
    };
  }
  if (ready === 0 && blockedOrManual === 0 && noChange === groups.length && groups.length > 0) {
    return {
      overallStatus: 'no_changes',
      suggestedAction: 'no_action',
    };
  }
  return {
    overallStatus: 'blocked',
    suggestedAction: 'investigate_blocks',
  };
}

/**
 * Build a deterministic GhostFlow refresh report from in-memory attempt results.
 */
export function buildGhostFlowRefreshReport(
  input: GhostFlowRefreshPlannerInput,
  registry: readonly GhostFlowRefreshRegistryEntry[] = GHOSTFLOW_REFRESH_REGISTRY
): GhostFlowStageResult<GhostFlowRefreshReport> {
  const registryById = new Map(
    registry.map((entry) => [entry.artifactId, entry] as const)
  );

  const validationIssues = validatePlannerInput(input, registry, registryById);
  if (validationIssues.length > 0) {
    return { ok: false, issues: validationIssues };
  }

  const requestedSet = new Set(input.requestedArtifactIds);
  const attemptById = new Map(
    input.attempts.map((a) => [a.artifactId, a] as const)
  );

  // Preserve registry order for selected groups and attempts.
  const orderedAttempts: GhostFlowArtifactRefreshAttempt[] = [];
  for (const entry of registry) {
    if (!requestedSet.has(entry.artifactId as GhostFlowRegisteredArtifactId)) continue;
    const attempt = attemptById.get(entry.artifactId as GhostFlowRegisteredArtifactId);
    if (!attempt) {
      return {
        ok: false,
        issues: [
          blockIssue(
            'missing_attempt',
            `Requested artifact ${entry.artifactId} is missing an attempt`
          ),
        ],
      };
    }
    orderedAttempts.push(attempt);
  }

  const orderedRequestedIds = orderedAttempts.map((a) => a.artifactId);

  const selectedEntries = registry.filter((entry) =>
    requestedSet.has(entry.artifactId as GhostFlowRegisteredArtifactId)
  );

  const groupIdsInOrder: string[] = [];
  const membersByGroup = new Map<string, GhostFlowRefreshRegistryEntry[]>();
  for (const entry of selectedEntries) {
    if (!membersByGroup.has(entry.candidateGroupId)) {
      groupIdsInOrder.push(entry.candidateGroupId);
      membersByGroup.set(entry.candidateGroupId, []);
    }
    membersByGroup.get(entry.candidateGroupId)!.push(entry);
  }

  const candidateGroups: GhostFlowCandidateGroupReport[] = [];
  for (const groupId of groupIdsInOrder) {
    const selectedMembers = membersByGroup.get(groupId);
    if (!selectedMembers || selectedMembers.length === 0) {
      return {
        ok: false,
        issues: [
          blockIssue(
            'candidate_group_resolution_failed',
            `Unable to resolve candidate group ${groupId}`
          ),
        ],
      };
    }
    const acceptanceUnit = selectedMembers[0]!.acceptanceUnit;
    const members =
      acceptanceUnit === 'candidate_group'
        ? registry.filter((e) => e.candidateGroupId === groupId)
        : selectedMembers;
    const group = resolveCandidateGroup(groupId, members, attemptById);
    if (!group) {
      return {
        ok: false,
        issues: [
          blockIssue(
            'candidate_group_resolution_failed',
            `Unable to resolve candidate group ${groupId}`
          ),
        ],
      };
    }
    candidateGroups.push(group);
  }

  const { overallStatus, suggestedAction } = computeOverallStatus(candidateGroups);

  const summary = {
    selectedArtifactCount: orderedRequestedIds.length,
    selectedGroupCount: candidateGroups.length,
    readyGroupCount: candidateGroups.filter((g) => g.status === 'ready_for_review').length,
    noChangeGroupCount: candidateGroups.filter((g) => g.status === 'no_change').length,
    blockedGroupCount: candidateGroups.filter((g) => g.status === 'blocked').length,
    manualInputGroupCount: candidateGroups.filter((g) => g.status === 'manual_input_required')
      .length,
    scoreFedReadyGroupCount: candidateGroups.filter(
      (g) => g.primaryLane === 'score_fed_equity' && g.status === 'ready_for_review'
    ).length,
    scoreFedBlockedGroupCount: candidateGroups.filter(
      (g) =>
        g.primaryLane === 'score_fed_equity' &&
        (g.status === 'blocked' || g.status === 'manual_input_required')
    ).length,
    displayOnlyReadyGroupCount: candidateGroups.filter(
      (g) => g.primaryLane === 'display_only_equity' && g.status === 'ready_for_review'
    ).length,
    displayOnlyBlockedGroupCount: candidateGroups.filter(
      (g) =>
        g.primaryLane === 'display_only_equity' &&
        (g.status === 'blocked' || g.status === 'manual_input_required')
    ).length,
    treasuryReadyGroupCount: candidateGroups.filter(
      (g) => g.primaryLane === 'treasury_display' && g.status === 'ready_for_review'
    ).length,
    treasuryBlockedGroupCount: candidateGroups.filter(
      (g) =>
        g.primaryLane === 'treasury_display' &&
        (g.status === 'blocked' || g.status === 'manual_input_required')
    ).length,
  };

  const reportIssues: GhostFlowRefreshIssue[] = [];
  for (const group of candidateGroups) {
    reportIssues.push(...group.issues);
  }

  const report: GhostFlowRefreshReport = {
    reportVersion: GHOSTFLOW_REFRESH_REPORT_VERSION,
    mode: GHOSTFLOW_REFRESH_REPORT_MODE,
    generatedAt: input.generatedAt,
    requestedArtifactIds: orderedRequestedIds,
    artifactAttempts: orderedAttempts,
    candidateGroups,
    summary,
    overallStatus,
    suggestedAction,
    requiresHumanReview: true,
    issues: reportIssues,
  };

  return { ok: true, value: report, issues: [] };
}
