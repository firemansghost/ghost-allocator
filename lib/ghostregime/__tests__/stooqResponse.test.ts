/**
 * Stooq response classification (API-key gate vs CSV)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isStooqApiKeyGateBody } from '../marketData';

describe('isStooqApiKeyGateBody', () => {
  it('detects Stooq plaintext apikey instructions (live failure mode)', () => {
    const sample = `Get your apikey:

1. Open https://stooq.com/q/d/?s=spy.us&get_apikey
2. Enter the captcha code.
3. Copy the CSV download link at the bottom of the page - it will contain the <apikey> variable.
4. Append the <apikey> variable with its value to your requests, e.g.
   https://stooq.com/q/d/l/?s=spy.us&d1=20240101&d2=20240413&i=d&apikey=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
`;
    assert.strictEqual(isStooqApiKeyGateBody(sample), true);
  });

  it('does not flag a normal CSV header', () => {
    assert.strictEqual(
      isStooqApiKeyGateBody('Date,Open,High,Low,Close,Volume\n2024-01-02,1,1,1,100,0'),
      false
    );
  });
});
