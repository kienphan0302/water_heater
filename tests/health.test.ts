import test from 'node:test';
import assert from 'node:assert/strict';
import type { D1Database } from '@cloudflare/workers-types';
import { onRequestGet } from '../functions/api/health';

function database(run: (sql: string) => Promise<{ success: boolean }>) {
  return { prepare: (sql: string) => ({ all: () => run(sql) }) } as unknown as D1Database;
}

test('health validates the complete schema without selecting customer rows', async () => {
  let query = '';
  const response = await onRequestGet({ env: { DB: database(async sql => {
    query = sql;
    return { success: true };
  }) } });
  assert.equal(response.status, 200);
  assert.match(query, /^SELECT /);
  assert.match(query, /notification_status FROM leads LIMIT 0$/);
  assert.deepEqual(await response.json(), {
    ok: true, formReady: true, databaseStatus: 'ready', notificationsReady: false,
  });
});

test('health reports an absent binding as unavailable', async () => {
  const response = await onRequestGet({ env: {} });
  assert.equal(response.status, 503);
  assert.equal((await response.json() as { databaseStatus: string }).databaseStatus, 'not_configured');
});

test('health does not report readiness when a table or column is missing', async () => {
  const response = await onRequestGet({ env: { DB: database(async () => {
    throw new Error('no such table: leads; private diagnostic');
  }) } });
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.equal(JSON.parse(body).formReady, false);
  assert.equal(JSON.parse(body).databaseStatus, 'unavailable');
  assert.doesNotMatch(body, /private diagnostic|no such table/);
});

test('health rejects an unsuccessful database result', async () => {
  const response = await onRequestGet({ env: { DB: database(async () => ({ success: false })) } });
  assert.equal(response.status, 503);
  assert.equal((await response.json() as { formReady: boolean }).formReady, false);
});
