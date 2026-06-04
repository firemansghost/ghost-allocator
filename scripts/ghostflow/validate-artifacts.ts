/**
 * Validates GhostFlow manual artifacts against JSON Schema + GhostFlow rules.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { validateEtfNetIssuanceArtifact } from '../../lib/ghostflow/artifacts/etfNetIssuance';
import { validatePassiveShareProxyArtifact } from '../../lib/ghostflow/artifacts/passiveShareProxy';
import { validateIndexConcentrationArtifact } from '../../lib/ghostflow/artifacts/indexConcentration';
import { validateActiveIndexFlowArtifact } from '../../lib/ghostflow/artifacts/activeIndexFlow';
import { validateVolatilityRegimeArtifact } from '../../lib/ghostflow/artifacts/volatilityRegime';
import { validateMarketBreadthArtifact } from '../../lib/ghostflow/artifacts/marketBreadth';
import { validateSystematicFlowProxyArtifact } from '../../lib/ghostflow/artifacts/systematicFlowProxy';
import { validateLeveredEtfRebalancePressureArtifact } from '../../lib/ghostflow/artifacts/leveredEtfRebalancePressure';
import { validateRetirementFlowPressureProxyArtifact } from '../../lib/ghostflow/artifacts/retirementFlowPressureProxy';
import { validateOptionsActivityProxyArtifact } from '../../lib/ghostflow/artifacts/optionsActivityProxy';
import { GHOSTFLOW_REFERENCE_AS_OF } from '../../lib/ghostflow/reference';

const root = process.cwd();

function loadJson(path: string): unknown {
  const text = readFileSync(path, 'utf8');
  return JSON.parse(text) as unknown;
}

function validateWithSchema(label: string, artifactPath: string, schemaPath: string): boolean {
  const schema = loadJson(schemaPath);
  const artifact = loadJson(artifactPath);
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema as object);

  if (!validate(artifact)) {
    console.error(`JSON Schema validation failed for ${label}:`);
    console.error(validate.errors);
    return false;
  }
  console.log(`JSON Schema: ${label} OK`);
  return true;
}

function main(): void {
  let failed = false;

  const volPath = join(root, 'data/ghostflow/artifacts/volatilityRegime.v1.json');
  const volSchemaPath = join(root, 'data/ghostflow/artifacts/schema.volatilityRegime.v1.json');
  const etfPath = join(root, 'data/ghostflow/artifacts/etfNetIssuance.v1.json');
  const etfSchemaPath = join(root, 'data/ghostflow/artifacts/schema.etfNetIssuance.v1.json');
  const activeIndexPath = join(root, 'data/ghostflow/artifacts/activeIndexFlow.v1.json');
  const activeIndexSchemaPath = join(root, 'data/ghostflow/artifacts/schema.activeIndexFlow.v1.json');
  const indexConcentrationPath = join(root, 'data/ghostflow/artifacts/indexConcentration.v1.json');
  const indexConcentrationSchemaPath = join(root, 'data/ghostflow/artifacts/schema.indexConcentration.v1.json');
  const passiveSharePath = join(root, 'data/ghostflow/artifacts/passiveShareProxy.v1.json');
  const passiveShareSchemaPath = join(root, 'data/ghostflow/artifacts/schema.passiveShareProxy.v1.json');

  if (!validateWithSchema('volatilityRegime.v1.json', volPath, volSchemaPath)) failed = true;

  const volRules = validateVolatilityRegimeArtifact(loadJson(volPath), GHOSTFLOW_REFERENCE_AS_OF);
  if (!volRules.ok) {
    failed = true;
    console.error('GhostFlow rules failed for vol-regime:');
    for (const err of volRules.errors) console.error(`  - ${err}`);
  } else {
    console.log(
      `GhostFlow rules: vol-regime OK (VIX ${volRules.artifact.observations.vixClose} as of ${volRules.artifact.asOf})`
    );
  }

  if (!validateWithSchema('etfNetIssuance.v1.json', etfPath, etfSchemaPath)) failed = true;

  const etfRules = validateEtfNetIssuanceArtifact(loadJson(etfPath), GHOSTFLOW_REFERENCE_AS_OF);
  if (!etfRules.ok) {
    failed = true;
    console.error('GhostFlow rules failed for etf-flow:');
    for (const err of etfRules.errors) console.error(`  - ${err}`);
  } else {
    const m = etfRules.artifact.observations.domesticEquityNetIssuanceMillionsUsd;
    console.log(
      `GhostFlow rules: etf-flow OK ($${(m / 1000).toFixed(1)}B domestic equity, week ended ${etfRules.artifact.asOf})`
    );
  }

  if (!validateWithSchema('activeIndexFlow.v1.json', activeIndexPath, activeIndexSchemaPath)) failed = true;

  const activeIndexRules = validateActiveIndexFlowArtifact(loadJson(activeIndexPath), GHOSTFLOW_REFERENCE_AS_OF);
  if (!activeIndexRules.ok) {
    failed = true;
    console.error('GhostFlow rules failed for active-index-flow:');
    for (const err of activeIndexRules.errors) console.error(`  - ${err}`);
  } else {
    const a = activeIndexRules.artifact.observations.activeDomesticEquityNetFlowMillionsUsd;
    const i = activeIndexRules.artifact.observations.indexDomesticEquityNetFlowMillionsUsd;
    const diff = i - a;
    console.log(
      `GhostFlow rules: active-index-flow OK (diff $${(diff / 1000).toFixed(1)}B, month ended ${activeIndexRules.artifact.asOf})`
    );
  }

  if (!validateWithSchema('indexConcentration.v1.json', indexConcentrationPath, indexConcentrationSchemaPath)) failed = true;

  const indexConcentrationRules = validateIndexConcentrationArtifact(
    loadJson(indexConcentrationPath),
    GHOSTFLOW_REFERENCE_AS_OF
  );
  if (!indexConcentrationRules.ok) {
    failed = true;
    console.error('GhostFlow rules failed for concentration:');
    for (const err of indexConcentrationRules.errors) console.error(`  - ${err}`);
  } else {
    const pct = indexConcentrationRules.artifact.observations.sp500Top10IndexWeightPercent;
    console.log(
      `GhostFlow rules: concentration OK (top-10 ${pct}%, month ended ${indexConcentrationRules.artifact.asOf})`
    );
  }

  if (!validateWithSchema('passiveShareProxy.v1.json', passiveSharePath, passiveShareSchemaPath)) failed = true;

  const passiveShareRules = validatePassiveShareProxyArtifact(loadJson(passiveSharePath), GHOSTFLOW_REFERENCE_AS_OF);
  if (!passiveShareRules.ok) {
    failed = true;
    console.error('GhostFlow rules failed for passive-share:');
    for (const err of passiveShareRules.errors) console.error(`  - ${err}`);
  } else {
    const pct = passiveShareRules.artifact.observations.indexAssetSharePercent;
    console.log(
      `GhostFlow rules: passive-share OK (ICI index share ${pct}%, month ended ${passiveShareRules.artifact.asOf})`
    );
  }

  const breadthPath = join(root, 'data/ghostflow/artifacts/marketBreadth.v1.json');
  const breadthSchemaPath = join(root, 'data/ghostflow/artifacts/schema.marketBreadth.v1.json');

  if (!validateWithSchema('marketBreadth.v1.json', breadthPath, breadthSchemaPath)) failed = true;

  const breadthRules = validateMarketBreadthArtifact(loadJson(breadthPath), GHOSTFLOW_REFERENCE_AS_OF);
  if (!breadthRules.ok) {
    failed = true;
    console.error('GhostFlow rules failed for breadth:');
    for (const err of breadthRules.errors) console.error(`  - ${err}`);
  } else {
    const pct = breadthRules.artifact.observations.sp500Above50DayMaPercent;
    console.log(
      `GhostFlow rules: breadth OK (${pct}% above 50-day MA as of ${breadthRules.artifact.asOf})`
    );
  }

  const systematicPath = join(root, 'data/ghostflow/artifacts/systematicFlowProxy.v1.json');
  const systematicRules = validateSystematicFlowProxyArtifact(
    loadJson(systematicPath),
    GHOSTFLOW_REFERENCE_AS_OF
  );
  if (!systematicRules.ok) {
    failed = true;
    console.error('GhostFlow rules failed for systematic-flow-proxy:');
    for (const err of systematicRules.errors) console.error(`  - ${err}`);
  } else {
    const b = systematicRules.artifact.basket;
    console.log(
      `GhostFlow rules: systematic-flow-proxy OK (basket ${b.basketNetPctOi}% OI → score ${b.basketScore}, asOf ${systematicRules.artifact.asOf}, published ${systematicRules.artifact.publishedAt})`
    );
  }

  const leveredPath = join(root, 'data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json');
  const leveredRules = validateLeveredEtfRebalancePressureArtifact(
    loadJson(leveredPath),
    { mode: 'production', referenceAsOf: GHOSTFLOW_REFERENCE_AS_OF }
  );
  if (!leveredRules.ok) {
    failed = true;
    console.error('GhostFlow rules failed for levered-etf-rebalance-pressure:');
    for (const err of leveredRules.errors) console.error(`  - ${err}`);
  } else {
    const o = leveredRules.artifact.observations;
    console.log(
      `GhostFlow rules: levered-etf-rebalance-pressure OK (${o.dominantDirection}, ${o.aggregateRebalancePctOfUniverseAum}% of AUM abs rebalance est., asOf ${leveredRules.artifact.asOf}, published ${leveredRules.artifact.publishedAt})`
    );
  }

  const retirementPath = join(root, 'data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json');
  const retirementRules = validateRetirementFlowPressureProxyArtifact(
    loadJson(retirementPath),
    { mode: 'production', referenceAsOf: GHOSTFLOW_REFERENCE_AS_OF }
  );
  if (!retirementRules.ok) {
    failed = true;
    console.error('GhostFlow rules failed for retirement-flow-pressure-proxy:');
    for (const err of retirementRules.errors) console.error(`  - ${err}`);
  } else {
    const o = retirementRules.artifact.observations;
    const qoq =
      o.quarterOverQuarterAssetGrowthPct != null
        ? `, QoQ ${o.quarterOverQuarterAssetGrowthPct}%`
        : '';
    console.log(
      `GhostFlow rules: retirement-flow-pressure-proxy OK ($${o.totalRetirementMarketAssetsTrillionsUsd}T total${qoq}, mappingStatus ${o.mappingStatus}, asOf ${retirementRules.artifact.asOf}, published ${retirementRules.artifact.publishedAt})`
    );
  }

  const optionsPath = join(root, 'data/ghostflow/artifacts/optionsActivityProxy.v1.json');
  const optionsRules = validateOptionsActivityProxyArtifact(loadJson(optionsPath), {
    mode: 'production',
    referenceAsOf: GHOSTFLOW_REFERENCE_AS_OF,
  });
  if (!optionsRules.ok) {
    failed = true;
    console.error('GhostFlow rules failed for options-activity-proxy:');
    for (const err of optionsRules.errors) console.error(`  - ${err}`);
  } else {
    const o = optionsRules.artifact.observations;
    const indexM = (o.indexOptionsContracts / 1_000_000).toFixed(1);
    const pcr =
      o.putCallRatio != null ? `, PCR ${o.putCallRatio.toFixed(2)}` : '';
    console.log(
      `GhostFlow rules: options-activity-proxy OK (index ${indexM}M contracts, ${o.indexShareOfTotalPct}% of total${pcr}, mappingStatus ${o.mappingStatus}, asOf ${optionsRules.artifact.asOf}, published ${optionsRules.artifact.publishedAt})`
    );
  }

  if (failed) process.exit(1);
  console.log('ghostflow:validate-artifacts: ok');
}

main();
