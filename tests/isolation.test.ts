import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateConfig, legacyDatabaseId } from '../scripts/project-config.mjs';

const source = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const productionId = '7a9aa5fb-e737-4a1f-bcb0-4e89f2b96c31';
const previewId = '533db26f-20c8-489f-a15e-af5a0825d36e';
const configured = () => {
  const config = structuredClone(source);
  config.d1_databases[0].database_id = productionId;
  config.env.preview.d1_databases[0].database_id = previewId;
  return config;
};
test('local configuration has no reference to the solar database', () => {
  assert.deepEqual(validateConfig(source), []);
  assert.notEqual(source.d1_databases[0].database_id, legacyDatabaseId);
});
test('deployment requires actual production and preview database IDs', () => {
  const config = configured();
  delete config.env.preview.d1_databases[0].database_id;
  assert.ok(validateConfig(config, { requireProvisioned: true }).some(error => error.startsWith('preview:')));
});
test('separate configured databases pass the deployment guard', () => {
  assert.deepEqual(validateConfig(configured(), { requireProvisioned: true }), []);
});
test('reusing the solar database is rejected in either environment', () => {
  for (const environment of ['production', 'preview']) {
    const config = configured();
    const binding = environment === 'production' ? config.d1_databases[0] : config.env.preview.d1_databases[0];
    binding.database_id = legacyDatabaseId;
    assert.ok(validateConfig(config).some(error => error.includes('điện mặt trời')));
  }
});
test('preview cannot write into the production database', () => {
  const config = configured();
  config.env.preview.d1_databases[0].database_id = productionId;
  assert.ok(validateConfig(config).some(error => error.includes('hai D1')));
});
test('an uppercase database UUID cannot bypass the solar database guard', () => {
  const config = configured();
  config.d1_databases[0].database_id = legacyDatabaseId.toUpperCase();
  assert.ok(validateConfig(config).some(error => error.includes('điện mặt trời')));
});
