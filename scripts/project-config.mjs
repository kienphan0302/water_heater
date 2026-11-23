export const legacyDatabaseId = 'ac352350-4d00-4f82-bba7-3bf2309a7440';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateConfig(config, { requireProvisioned = false } = {}) {
  const errors = [];
  if (!config.name || !/^[a-z0-9][a-z0-9-]{0,57}$/.test(config.name) || config.name === 'solar-power') {
    errors.push('Tên dự án phải thuộc website bình nóng lạnh, khác solar-power.');
  }
  if (config.pages_build_output_dir !== './dist') errors.push('Build output phải là ./dist.');
  const environments = [
    ['production', config.d1_databases, 'water-heater-leads'],
    ['preview', config.env?.preview?.d1_databases, 'water-heater-leads-preview'],
  ];
  const ids = [];
  for (const [environment, bindings, expectedName] of environments) {
    const database = bindings?.find(binding => binding.binding === 'DB');
    if (bindings?.length !== 1 || !database || database.database_name !== expectedName) {
      errors.push(`${environment}: cần duy nhất binding DB với database_name ${expectedName}.`);
      continue;
    }
    const id = database.database_id;
    if (typeof id === 'string' && id.toLowerCase() === legacyDatabaseId) errors.push(`${environment}: không được liên kết D1 điện mặt trời.`);
    if (id && (typeof id !== 'string' || !uuid.test(id) || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(id))) {
      errors.push(`${environment}: database_id phải là UUID thực tế do Cloudflare cấp.`);
    }
    if (requireProvisioned && !id) errors.push(`${environment}: chưa có database_id. Chạy npm run cloudflare:configure trước.`);
    if (typeof id === 'string' && id) ids.push(id.toLowerCase());
  }
  if (ids.length === 2 && ids[0] === ids[1]) errors.push('Production và preview phải dùng hai D1 khác nhau.');
  return errors;
}
