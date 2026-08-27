import type { GhostFlowDurableProvenance } from '../types';
import type {
  GhostFlowCandidateDiff,
  GhostFlowCandidateFieldChange,
  GhostFlowCandidateObservationDateRelation,
} from './types';

function compareObservationDates(
  currentAsOf: string,
  candidateAsOf: string
): GhostFlowCandidateObservationDateRelation {
  if (candidateAsOf > currentAsOf) return 'newer';
  if (candidateAsOf < currentAsOf) return 'older';
  return 'same';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function walkDiff(
  current: unknown,
  candidate: unknown,
  path: string,
  additions: string[],
  removals: string[],
  changes: GhostFlowCandidateFieldChange[]
): void {
  if (Array.isArray(current) && Array.isArray(candidate)) {
    const max = Math.max(current.length, candidate.length);
    for (let i = 0; i < max; i += 1) {
      const childPath = `${path}[${i}]`;
      if (i >= current.length) {
        additions.push(childPath);
        continue;
      }
      if (i >= candidate.length) {
        removals.push(childPath);
        continue;
      }
      walkDiff(current[i], candidate[i], childPath, additions, removals, changes);
    }
    return;
  }

  if (isPlainObject(current) && isPlainObject(candidate)) {
    const keys = Array.from(
      new Set([...Object.keys(current), ...Object.keys(candidate)])
    ).sort();
    for (const key of keys) {
      const childPath = `${path}.${key}`;
      const hasCurrent = Object.prototype.hasOwnProperty.call(current, key);
      const hasCandidate = Object.prototype.hasOwnProperty.call(candidate, key);
      if (!hasCurrent && hasCandidate) {
        additions.push(childPath);
        continue;
      }
      if (hasCurrent && !hasCandidate) {
        removals.push(childPath);
        continue;
      }
      walkDiff(current[key], candidate[key], childPath, additions, removals, changes);
    }
    return;
  }

  const currentJson = JSON.stringify(current ?? null);
  const candidateJson = JSON.stringify(candidate ?? null);
  if (currentJson !== candidateJson) {
    changes.push({
      path,
      currentValue: current ?? null,
      candidateValue: candidate ?? null,
    });
  }
}

export function buildCandidateDiff(input: {
  currentArtifact: unknown;
  candidateArtifact: unknown;
  currentObservationAsOf: string;
  candidateObservationAsOf: string;
  candidateSourceProvenance: GhostFlowDurableProvenance;
  currentPromotionPayloadSha256: string;
  candidatePromotionPayloadSha256: string;
}): GhostFlowCandidateDiff {
  const additions: string[] = [];
  const removals: string[] = [];
  const fieldChanges: GhostFlowCandidateFieldChange[] = [];

  walkDiff(
    input.currentArtifact,
    input.candidateArtifact,
    '$',
    additions,
    removals,
    fieldChanges
  );

  additions.sort();
  removals.sort();
  fieldChanges.sort((a, b) => a.path.localeCompare(b.path));

  return {
    currentObservationAsOf: input.currentObservationAsOf,
    candidateObservationAsOf: input.candidateObservationAsOf,
    observationDateRelation: compareObservationDates(
      input.currentObservationAsOf,
      input.candidateObservationAsOf
    ),
    fieldAdditions: additions,
    fieldRemovals: removals,
    fieldChanges,
    candidateSourceProvenance: { ...input.candidateSourceProvenance },
    promotionPayloadChanged:
      input.currentPromotionPayloadSha256 !== input.candidatePromotionPayloadSha256,
  };
}
