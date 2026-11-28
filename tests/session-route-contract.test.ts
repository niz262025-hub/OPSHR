import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('satellite session endpoint cannot revoke a MYOPS login', async () => {
  const source = await readFile(new URL('../app/api/session/route.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /export\s+(?:async\s+)?function\s+DELETE\b|end_central_login|\.set\s*\(\s*SESSION_COOKIE/);
  assert.match(source, /export\s+async\s+function\s+GET\b/);
  assert.match(source, /export\s+async\s+function\s+POST\b/);
});
