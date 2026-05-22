/**
 * GhostFlow v0.2 — static public-data artifact types.
 */

export type GhostFlowArtifactDataQuality = 'verified_manual' | 'manual_unverified' | 'mock_fallback';

export type GhostFlowArtifactFreshnessStatus = 'fresh' | 'caution' | 'stale' | 'missing';

export type GhostFlowUpdateFrequency = 'daily';

export interface VolatilityRegimeArtifactSource {
  name: string;
  url?: string;
  note?: string;
}

export interface VolatilityRegimeObservations {
  vixClose: number;
}

export interface VolatilityRegimeOptionalObservations {
  vix9dClose?: number | null;
  vix3mClose?: number | null;
  spyRealizedVol21dAnn?: number | null;
}

export interface VolatilityRegimeArtifactV1 {
  artifactVersion: '1';
  signalId: 'vol-regime';
  asOf: string;
  publishedAt?: string;
  source: VolatilityRegimeArtifactSource;
  updateFrequency: GhostFlowUpdateFrequency;
  dataQuality: 'verified_manual' | 'manual_unverified';
  observations: VolatilityRegimeObservations;
  optionalObservations?: VolatilityRegimeOptionalObservations;
}

export interface VolatilityRegimeValidationResult {
  ok: true;
  artifact: VolatilityRegimeArtifactV1;
}

export interface VolatilityRegimeValidationError {
  ok: false;
  errors: string[];
}

export type VolatilityRegimeValidation = VolatilityRegimeValidationResult | VolatilityRegimeValidationError;

export interface ArtifactFreshnessResult {
  status: GhostFlowArtifactFreshnessStatus;
  tradingDaysStale: number;
  warnings: string[];
}

export interface GhostFlowSnapshotMeta {
  dataMix: 'mock' | 'mixed';
  freshnessWarnings: string[];
  volRegimeSource: 'public' | 'mock_fallback';
  volRegimeAsOf?: string;
  publicPassiveInputKeys: Array<'optionsVolatilityAmplifier'>;
}

export interface GhostFlowBuildResult {
  raw: import('../types').GhostFlowRawSnapshot;
  meta: GhostFlowSnapshotMeta;
}
