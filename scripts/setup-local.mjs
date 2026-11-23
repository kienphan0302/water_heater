import { copyFile, access, readFile, writeFile } from 'node:fs/promises';
const exists = async file => { try { await access(file); return true; } catch { return false; } };
if (!await exists('.env')) {
  const contents = (await readFile('.env.example', 'utf8')).replace('https://your-domain.example', 'http://127.0.0.1:4321');
  await writeFile('.env', contents);
}
if (!await exists('.dev.vars')) await copyFile('.dev.vars.example', '.dev.vars');
console.log('Đã chuẩn bị cấu hình local. Chạy npm run db:local trước khi dùng npm run preview.');
