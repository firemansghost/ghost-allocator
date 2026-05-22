/**
 * GhostFlow — static public-data artifact types.
 */

import type { PassivePressureInputs } from '../types';

export type GhostFlowArtifactDataQuality = 'verified_manual' | 'manual_unverified' | 'mock_fallback';

export type GhostFlowArtifactFreshnessStatus = 'fresh' | 'caution' | 'stale' | 'missing';

export type GhostFlowUpdateFrequency = 'daily' | 'weekly';

export type EtfNetIssuanceSeriesDefinition = 'domestic_equity_etf_estimated_weekly_net_issuance';

export interface ArtifactSource {
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
  source: ArtifactSource;
  updateFrequency: 'daily';
  dataQuality: 'verified_manual' | 'manual_unverified';
  observations: VolatilityRegimeObservations;
  optionalObservations?: VolatilityRegimeOptionalObservations;
}

export interface EtfNetIssuanceObservations {
  domesticEquityNetIssuanceMillionsUsd: number;
}

export interface EtfNetIssuanceOptionalObservations {
  totalEtfNetIssuanceMillionsUsd?: number | null;
  equityEtfNetIssuanceMillionsUsd?: number | null;
  fourWeekAverageDomesticEquityMillionsUsd?: number | null;
}

export interface EtfNetIssuanceArtifactV1 {
  artifactVersion: '1';
  signalId: 'etf-flow';
  asOf: string;
  publishedAt?: string;
  source: ArtifactSource;
  seriesDefinition: EtfNetIssuanceSeriesDefinition;
  updateFrequency: 'weekly';
  dataQuality: 'verified_manual' | 'manual_unverified';
  observations: EtfNetIssuanceObservations;
  optionalObservations?: EtfNetIssuanceOptionalObservations;
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

export interface EtfNetIssuanceValidationResult {
  ok: true;
  artifact: EtfNetIssuanceArtifactV1;
}

export interface EtfNetIssuanceValidationError {
  ok: false;
  errors: string[];
}

export type EtfNetIssuanceValidation = EtfNetIssuanceValidationResult | EtfNetIssuanceValidationError;

export interface ArtifactFreshnessResult {
  status: GhostFlowArtifactFreshnessStatus;
  ageDays: number;
  warnings: string[];
}

export interface GhostFlowPublicSignalMeta {
  signalId: string;
  name: string;
  sourceName: string;
  sourceUrl?: string;
  asOf: string;
  publishedAt?: string;
  freshnessStatus: GhostFlowArtifactFreshnessStatus;
}

export interface GhostFlowSnapshotMeta {
  dataMix: 'mock' | 'mixed';
  freshnessWarnings: string[];
  publicSignalCount: number;
  publicSignals: GhostFlowPublicSignalMeta[];
  publicPassiveInputKeys: Array<keyof PassivePressureInputs>;
  /** @deprecated Prefer publicSignals */
  volRegimeSource: 'public' | 'mock_fallback';
  /** @deprecated Prefer publicSignals */
  volRegimeAsOf?: string;
  /** @deprecated Prefer publicSignals */
  etfFlowSource: 'public' | 'mock_fallback';
  /** @deprecated Prefer publicSignals */
  etfFlowAsOf?: string;
}

export interface GhostFlowBuildResult {
  raw: import('../types').GhostFlowRawSnapshot;
  meta: GhostFlowSnapshotMeta;
}

export interface ApplyArtifactOutcome {
  raw: import('../types').GhostFlowRawSnapshot;
  warnings: string[];
  publicSignal?: GhostFlowPublicSignalMeta;
  publicPassiveInputKey?: keyof PassivePressureInputs;
}
