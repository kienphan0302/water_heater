import { readFile } from 'node:fs/promises';
import { validateConfig } from './project-config.mjs';

const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const errors = validateConfig(config, { requireProvisioned: process.argv.includes('--require-provisioned') });
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Cấu hình độc lập: water_heater, water-heater-leads và water-heater-leads-preview.');
  if (!config.d1_databases[0].database_id) console.log('Chưa cấu hình D1 Cloudflare; build triển khai sẽ chờ UUID thực tế.');
}
