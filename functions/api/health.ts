import type { Env } from '../../lib/leads';

export const onRequestGet = ({ env }: { env: Env }) => new Response(JSON.stringify({
  ok: true,
  formReady: Boolean(env.DB),
  notificationsReady: Boolean(env.WATER_HEATER_RESEND_API_KEY && env.WATER_HEATER_FROM_EMAIL && env.WATER_HEATER_NOTIFY_EMAIL),
}), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
