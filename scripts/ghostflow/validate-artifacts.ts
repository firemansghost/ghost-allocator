/**
 * Validates GhostFlow manual artifacts against JSON Schema + GhostFlow rules.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { GHOSTFLOW_REFERENCE_AS_OF } from '../../lib/ghostflow/reference';
import { validateVolatilityRegimeArtifact } from '../../lib/ghostflow/artifacts/volatilityRegime';

const root = process.cwd();
const volPath = join(root, 'data/ghostflow/artifacts/volatilityRegime.v1.json');
const schemaPath = join(root, 'data/ghostflow/artifacts/schema.volatilityRegime.v1.json');

function loadJson(path: string): unknown {
  const text = readFileSync(path, 'utf8');
  return JSON.parse(text) as unknown;
}

function main(): void {
  let failed = false;

  const schema = loadJson(schemaPath);
  const artifact = loadJson(volPath);

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema as object);

  if (!validate(artifact)) {
    failed = true;
    console.error('JSON Schema validation failed for volatilityRegime.v1.json:');
    console.error(validate.errors);
  } else {
    console.log('JSON Schema: volatilityRegime.v1.json OK');
  }

  const rules = validateVolatilityRegimeArtifact(artifact, GHOSTFLOW_REFERENCE_AS_OF);
  if (!rules.ok) {
    failed = true;
    console.error('GhostFlow artifact rules failed:');
    for (const err of rules.errors) console.error(`  - ${err}`);
  } else {
    console.log(
      `GhostFlow rules: vol-regime OK (VIX ${rules.artifact.observations.vixClose} as of ${rules.artifact.asOf})`
    );
  }

  if (failed) process.exit(1);
  console.log('ghostflow:validate-artifacts: ok');
}

main();
