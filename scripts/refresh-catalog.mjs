import { spawnSync } from 'node:child_process';

for (const command of [['python3', 'ingestion/import_catalog.py', '--refresh'], ['node', 'scripts/sync-catalog.mjs']]) {
  const result = spawnSync(command[0], command.slice(1), { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
