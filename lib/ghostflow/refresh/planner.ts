/**
 * GhostFlow offline refresh planner — pure, deterministic, report-only.
 * No I/O, network, env, clocks, randomness, scoring, or production writes.
 */

import {
  GATE_C_ARTIFACT_IDS,
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

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function blockIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'validate', code, severity: 'block', message };
}

function reconcileIssue(code: string, message: string): GhostFlowRefreshIssue {
  return { stage: 'reconcile', code, severity: 'block', message };
}

function isRegisteredArtifactId(
  id: string,
  registryById: ReadonlyMap<string, GhostFlowRefreshRegistryEntry>
): id is GhostFlowRegisteredArtifactId {
  return registryById.has(id);
}

function validatePlannerInput(
  input: GhostFlowRefreshPlannerInput,
  registryById: ReadonlyMap<string, GhostFlowRefreshRegistryEntry>
): GhostFlowRefreshIssue[] {
  const issues: GhostFlowRefreshIssue[] = [];

  if (!ISO_TIMESTAMP_RE.test(input.generatedAt)) {
    issues.push(
      blockIssue(
        'invalid_generated_at',
        `generatedAt must be a valid ISO timestamp; got "${input.generatedAt}"`
      )
    );
  }

  const requested = input.requestedArtifactIds;
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

  const gateCRequested = GATE_C_ARTIFACT_IDS.filter((id) => seenRequested.has(id));
  if (gateCRequested.length === 1) {
    issues.push(
      blockIssue(
        'gate_c_selection_incomplete',
        `Gate C selection requires both ${GATE_C_ARTIFACT_IDS.join(' and ')}; only ${gateCRequested[0]} was requested`
      )
    );
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

    if (attempt.status === 'candidate_observation_available') {
      // Runtime guard: callers may bypass the discriminated union at the boundary.
      const candidate = (attempt as { candidate?: typeof attempt.candidate }).candidate;
      if (!candidate) {
        issues.push(
          blockIssue(
            'candidate_summary_required',
            `Attempt ${attempt.artifactId} has candidate_observation_available without candidate summary`
          )
        );
      } else {
        if (!ISO_DATE_RE.test(candidate.observationAsOf)) {
          issues.push(
            blockIssue(
              'invalid_candidate_observation_as_of',
              `Attempt ${attempt.artifactId} candidate.observationAsOf must be YYYY-MM-DD`
            )
          );
        }
        if (
          candidate.sourcePublishedAt !== undefined &&
          !ISO_DATE_RE.test(candidate.sourcePublishedAt)
        ) {
          issues.push(
            blockIssue(
              'invalid_candidate_source_published_at',
              `Attempt ${attempt.artifactId} candidate.sourcePublishedAt must be YYYY-MM-DD`
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
        }
        if (!candidate.adapterId.trim()) {
          issues.push(
            blockIssue(
              'empty_candidate_adapter_id',
              `Attempt ${attempt.artifactId} candidate.adapterId must be nonempty`
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
  attemptById: ReadonlyMap<GhostFlowRegisteredArtifactId, GhostFlowArtifactRefreshAttempt>
): GhostFlowCandidateGroupReport {
  const artifactIds = members.map((m) => m.artifactId as GhostFlowRegisteredArtifactId);
  const attempts = artifactIds.map((id) => attemptById.get(id)!);
  const lanes = [...new Set(members.map((m) => m.lane))];
  const primaryLane = members[0]!.lane;
  const failureSeverities = [
    ...new Set(members.map((m) => m.failureSeverity)),
  ] as GhostFlowCandidateGroupReport['failureSeverities'];

  const observationAsOfValues = attempts
    .filter(
      (a): a is Extract<GhostFlowArtifactRefreshAttempt, { status: 'candidate_observation_available' }> =>
        a.status === 'candidate_observation_available'
    )
    .map((a) => a.candidate.observationAsOf);

  const issues: GhostFlowRefreshIssue[] = [];
  let status: GhostFlowCandidateGroupStatus;

  if (members[0]!.acceptanceUnit === 'artifact') {
    status = resolveArtifactGroupStatus(attempts[0]!);
    issues.push(...attempts[0]!.issues);
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
    acceptanceUnit: members[0]!.acceptanceUnit,
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

  const validationIssues = validatePlannerInput(input, registryById);
  if (validationIssues.length > 0) {
    return { ok: false, issues: validationIssues };
  }

  const requestedSet = new Set(input.requestedArtifactIds);
  const attemptById = new Map(
    input.attempts.map((a) => [a.artifactId, a] as const)
  );

  // Preserve registry order for selected groups and attempts.
  const orderedAttempts = registry
    .filter((entry) => requestedSet.has(entry.artifactId as GhostFlowRegisteredArtifactId))
    .map((entry) => attemptById.get(entry.artifactId as GhostFlowRegisteredArtifactId)!);

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

  // For candidate_group acceptance, include all registered members of a selected group.
  // Gate C selection closure already ensures both members are requested when either is.
  const candidateGroups: GhostFlowCandidateGroupReport[] = groupIdsInOrder.map((groupId) => {
    const selectedMembers = membersByGroup.get(groupId)!;
    const acceptanceUnit = selectedMembers[0]!.acceptanceUnit;
    const members =
      acceptanceUnit === 'candidate_group'
        ? registry.filter((e) => e.candidateGroupId === groupId)
        : selectedMembers;
    return resolveCandidateGroup(groupId, members, attemptById);
  });

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
