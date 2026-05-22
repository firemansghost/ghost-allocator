/**
 * Validates GhostFlow manual artifacts against JSON Schema + GhostFlow rules.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { validateEtfNetIssuanceArtifact } from '../../lib/ghostflow/artifacts/etfNetIssuance';
import { validateActiveIndexFlowArtifact } from '../../lib/ghostflow/artifacts/activeIndexFlow';
import { validateVolatilityRegimeArtifact } from '../../lib/ghostflow/artifacts/volatilityRegime';
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

  if (failed) process.exit(1);
  console.log('ghostflow:validate-artifacts: ok');
}

main();
