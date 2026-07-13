/**
 * Deterministic fixtures for GhostFlow refresh planner tests.
 * No clock, randomness, or I/O.
 */

import {
  GHOSTFLOW_REFRESH_REGISTRY,
  type GhostFlowRegisteredArtifactId,
} from '../../refresh/registry';
import type {
  GhostFlowCandidateAvailableAttempt,
  GhostFlowCandidateObservationSummary,
  GhostFlowCurrentArtifactSummary,
  GhostFlowManualInputAttempt,
  GhostFlowNoNewerAttempt,
  GhostFlowNotAttemptedAttempt,
  GhostFlowSourceFailedAttempt,
} from '../../refresh/report';
import type { GhostFlowRefreshIssue } from '../../refresh/types';

const registryById = new Map(
  GHOSTFLOW_REFRESH_REGISTRY.map((e) => [e.artifactId, e] as const)
);

function registryEntry(artifactId: GhostFlowRegisteredArtifactId) {
  const entry = registryById.get(artifactId);
  if (!entry) {
    throw new Error(`Unknown artifactId for fixture: ${artifactId}`);
  }
  return entry;
}

export function currentArtifactSummary(
  artifactId: GhostFlowRegisteredArtifactId,
  opts?: {
    observationAsOf?: string;
    sourcePublishedAt?: string;
    artifactPath?: string;
  }
): GhostFlowCurrentArtifactSummary {
  const entry = registryEntry(artifactId);
  return {
    artifactId,
    artifactPath: opts?.artifactPath ?? entry.artifactPath,
    observationAsOf: opts?.observationAsOf,
    sourcePublishedAt: opts?.sourcePublishedAt,
  };
}

export function candidateSummary(opts: {
  observationAsOf: string;
  retrievedAt: string;
  contentSha256: string;
  adapterId: string;
  parserVersion: string;
  sourcePublishedAt?: string;
}): GhostFlowCandidateObservationSummary {
  return {
    observationAsOf: opts.observationAsOf,
    sourcePublishedAt: opts.sourcePublishedAt,
    retrievedAt: opts.retrievedAt,
    contentSha256: opts.contentSha256,
    adapterId: opts.adapterId,
    parserVersion: opts.parserVersion,
  };
}

const DEFAULT_CANDIDATE = {
  retrievedAt: '2026-07-09T12:00:00.000Z',
  contentSha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  parserVersion: '0.0.0-test',
} as const;

export function candidateAttempt(
  artifactId: GhostFlowRegisteredArtifactId,
  observationAsOf: string,
  opts?: {
    currentAsOf?: string;
    currentSourcePublishedAt?: string;
    sourcePublishedAt?: string;
    contentSha256?: string;
    adapterId?: string;
    parserVersion?: string;
    retrievedAt?: string;
    issues?: readonly GhostFlowRefreshIssue[];
    artifactPath?: string;
  }
): GhostFlowCandidateAvailableAttempt {
  const entry = registryEntry(artifactId);
  return {
    artifactId,
    status: 'candidate_observation_available',
    current: currentArtifactSummary(artifactId, {
      observationAsOf: opts?.currentAsOf ?? '2026-07-01',
      sourcePublishedAt: opts?.currentSourcePublishedAt,
      artifactPath: opts?.artifactPath,
    }),
    candidate: candidateSummary({
      observationAsOf,
      sourcePublishedAt: opts?.sourcePublishedAt,
      retrievedAt: opts?.retrievedAt ?? DEFAULT_CANDIDATE.retrievedAt,
      contentSha256: opts?.contentSha256 ?? DEFAULT_CANDIDATE.contentSha256,
      adapterId: opts?.adapterId ?? entry.adapter.adapterId,
      parserVersion: opts?.parserVersion ?? DEFAULT_CANDIDATE.parserVersion,
    }),
    issues: opts?.issues ?? [],
  };
}

export function noNewerAttempt(
  artifactId: GhostFlowRegisteredArtifactId,
  opts?: {
    currentAsOf?: string;
    currentSourcePublishedAt?: string;
    issues?: readonly GhostFlowRefreshIssue[];
    artifactPath?: string;
  }
): GhostFlowNoNewerAttempt {
  return {
    artifactId,
    status: 'no_newer_observation',
    current: currentArtifactSummary(artifactId, {
      observationAsOf: opts?.currentAsOf ?? '2026-07-01',
      sourcePublishedAt: opts?.currentSourcePublishedAt,
      artifactPath: opts?.artifactPath,
    }),
    issues: opts?.issues ?? [],
  };
}

export function sourceFailedAttempt(
  artifactId: GhostFlowRegisteredArtifactId,
  opts?: {
    currentAsOf?: string;
    issues?: readonly GhostFlowRefreshIssue[];
    artifactPath?: string;
  }
): GhostFlowSourceFailedAttempt {
  return {
    artifactId,
    status: 'source_failed',
    current: currentArtifactSummary(artifactId, {
      observationAsOf: opts?.currentAsOf ?? '2026-07-01',
      artifactPath: opts?.artifactPath,
    }),
    issues: opts?.issues ?? [
      {
        stage: 'fetch',
        code: 'source_unreachable',
        severity: 'block',
        message: `${artifactId} source failed`,
      },
    ],
  };
}

export function manualInputAttempt(
  artifactId: GhostFlowRegisteredArtifactId,
  opts?: {
    currentAsOf?: string;
    issues?: readonly GhostFlowRefreshIssue[];
    artifactPath?: string;
  }
): GhostFlowManualInputAttempt {
  return {
    artifactId,
    status: 'manual_input_required',
    current: currentArtifactSummary(artifactId, {
      observationAsOf: opts?.currentAsOf ?? '2026-07-01',
      artifactPath: opts?.artifactPath,
    }),
    issues: opts?.issues ?? [
      {
        stage: 'fetch',
        code: 'manual_operator_packet_required',
        severity: 'review',
        message: `${artifactId} requires operator packet`,
      },
    ],
  };
}

export function notAttemptedAttempt(
  artifactId: GhostFlowRegisteredArtifactId,
  opts?: {
    currentAsOf?: string;
    issues?: readonly GhostFlowRefreshIssue[];
    artifactPath?: string;
  }
): GhostFlowNotAttemptedAttempt {
  return {
    artifactId,
    status: 'not_attempted',
    current: currentArtifactSummary(artifactId, {
      observationAsOf: opts?.currentAsOf ?? '2026-07-01',
      artifactPath: opts?.artifactPath,
    }),
    issues: opts?.issues ?? [],
  };
}

export const PLANNER_GENERATED_AT = '2026-07-09T15:30:00.000Z';
