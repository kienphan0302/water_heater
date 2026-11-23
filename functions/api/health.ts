import type { Env } from '../../lib/leads';

export const onRequestGet = async ({ env }: { env: Partial<Env> }) => {
  let databaseStatus = env.DB ? 'unavailable' : 'not_configured';
  if (env.DB) {
    try {
      // Validate the schema without reading or changing any customer rows.
      const result = await env.DB.prepare(`SELECT id, created_at, name, phone, area,
        monthly_bill, source_path, utm_source, utm_medium, utm_campaign,
        utm_content, utm_term, status, notification_status FROM leads LIMIT 0`).all();
      if (result.success) databaseStatus = 'ready';
    } catch {
      // Do not expose database errors or internal configuration publicly.
    }
  }
  const formReady = databaseStatus === 'ready';
  return new Response(JSON.stringify({
    ok: formReady,
    formReady,
    databaseStatus,
    notificationsReady: Boolean(env.WATER_HEATER_RESEND_API_KEY && env.WATER_HEATER_FROM_EMAIL && env.WATER_HEATER_NOTIFY_EMAIL),
  }), {
    status: formReady ? 200 : 503,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
