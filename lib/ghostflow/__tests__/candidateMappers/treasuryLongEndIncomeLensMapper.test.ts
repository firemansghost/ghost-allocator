import assert from 'node:assert/strict';
import { validateTreasuryLongEndIncomeLensArtifact } from '@/lib/ghostflow/artifacts/treasuryLongEndIncomeLens';
import { mapTreasuryLongEndIncomeLensCandidate } from '@/lib/ghostflow/refresh/candidateMappers/treasuryLongEndIncomeLens';
import { GHOSTFLOW_REFRESH_REGISTRY } from '@/lib/ghostflow/refresh/registry';
import { fixtureH15Normalized } from '../fixtures/candidateMapperFixtures';

const registryEntry = GHOSTFLOW_REFRESH_REGISTRY.find(
  (entry) => entry.artifactId === 'treasuryLongEndIncomeLens'
)!;

const normalized = fixtureH15Normalized();
const result = mapTreasuryLongEndIncomeLensCandidate({ normalized, registryEntry });
assert.strictEqual(result.ok, true, result.ok ? '' : result.issues.map((i) => i.message).join('; '));
if (!result.ok) throw new Error('unreachable');

assert.strictEqual(result.value.seriesDefinition, 'frb_h15_treasury_long_end_income_lens_v1');
assert.strictEqual(result.value.dataQuality, 'verified_automated');
assert.strictEqual(result.value.publishedAt, undefined);
assert.strictEqual(result.value.source.series.length, 5);
assert.ok(
  !('tenYearBreakevenInflationPct' in result.value.observations) ||
    result.value.observations.tenYearBreakevenInflationPct === undefined
);
assert.ok(
  validateTreasuryLongEndIncomeLensArtifact(result.value, { mode: 'production' }).ok
);

const repeat = mapTreasuryLongEndIncomeLensCandidate({ normalized, registryEntry });
assert.deepStrictEqual(repeat.value, result.value);

console.log('ghostflow/candidateMappers/treasuryLongEndIncomeLensMapper.test.ts: ok');
