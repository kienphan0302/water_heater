import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { validateConfig } from './project-config.mjs';

const { values } = parseArgs({ options: {
  'production-id': { type: 'string' },
  'preview-id': { type: 'string' },
  'project-name': { type: 'string' },
} });
const file = new URL('../wrangler.jsonc', import.meta.url);
const config = JSON.parse(await readFile(file, 'utf8'));
if (values['project-name']) config.name = values['project-name'];
if (values['production-id']) config.d1_databases[0].database_id = values['production-id'];
if (values['preview-id']) config.env.preview.d1_databases[0].database_id = values['preview-id'];
const errors = validateConfig(config, { requireProvisioned: true });
if (errors.length) {
  console.error(errors.join('\n'));
  console.error('Cách dùng: npm run cloudflare:configure -- --production-id UUID_THUC_TE --preview-id UUID_THUC_TE');
  process.exitCode = 1;
} else {
  await writeFile(file, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`Đã cấu hình ${config.name}; production và preview dùng D1 riêng. Commit wrangler.jsonc trước khi triển khai.`);
}
