import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  WATER_HEATER_TURNSTILE_SECRET_KEY?: string;
  WATER_HEATER_RESEND_API_KEY?: string;
  WATER_HEATER_FROM_EMAIL?: string;
  WATER_HEATER_NOTIFY_EMAIL?: string;
}

export interface Lead {
  id: string; name: string; phone: string; area: string; monthly_bill: string;
  source_path: string; utm_source: string; utm_medium: string; utm_campaign: string;
  utm_content: string; utm_term: string;
}

export interface LeadContext {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}

const testSecret = '1x0000000000000000000000000000000AA';
const localhost = (host: string) => ['localhost', '127.0.0.1', '[::1]'].includes(host);
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

async function verifyToken(token: string, secret: string, hostname: string): Promise<boolean> {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token }), signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return false;
  const result = await response.json() as { success: boolean; hostname?: string };
  return result.success === true && (localhost(hostname) || result.hostname === hostname);
}

async function notifySales(lead: Lead, env: Env): Promise<void> {
  const body = [
    'Có yêu cầu tư vấn máy nước nóng / thiết bị gia đình mới.', `Mã: ${lead.id}`,
    `Họ tên: ${lead.name || '(không cung cấp)'}`, `Điện thoại: ${lead.phone}`,
    `Khu vực: ${lead.area}`, `Sản phẩm / trang nguồn: ${lead.source_path}`,
    `Nguồn: ${lead.utm_source || '(trực tiếp)'} / ${lead.utm_campaign || ''}`
  ].join('\n');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: {
      Authorization: `Bearer ${env.WATER_HEATER_RESEND_API_KEY}`, 'Content-Type': 'application/json',
      'Idempotency-Key': `lead-${lead.id}`
    },
    body: JSON.stringify({ from: env.WATER_HEATER_FROM_EMAIL, to: [env.WATER_HEATER_NOTIFY_EMAIL],
      subject: 'Yêu cầu tư vấn Bình Nóng Lạnh mới', text: body }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error('Email provider rejected notification');
}

export function createLeadHandler(deps = { verifyToken, notifySales }) {
  return async (context: LeadContext): Promise<Response> => {
    const { request, env } = context;
    if (request.method !== 'POST') return json({ success: false, message: 'Phương thức không hợp lệ.' }, 405);
    const url = new URL(request.url);
    if (request.headers.get('origin') !== url.origin) return json({ success: false, message: 'Nguồn gửi không hợp lệ.' }, 403);
    if (!request.headers.get('content-type')?.includes('application/json')) return json({ success: false, message: 'Dữ liệu không hợp lệ.' }, 415);
    const turnstileSecret = env.WATER_HEATER_TURNSTILE_SECRET_KEY;
    if (!env.DB || (!localhost(url.hostname) && turnstileSecret === testSecret)) {
      return json({ success: false, message: 'Biểu mẫu chưa sẵn sàng. Vui lòng liên hệ trực tiếp.' }, 503);
    }
    let input: Record<string, unknown>;
    try {
      const text = await request.text();
      if (text.length > 8192) return json({ success: false, message: 'Dữ liệu quá lớn.' }, 413);
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body');
      input = parsed as Record<string, unknown>;
    } catch { return json({ success: false, message: 'Vui lòng kiểm tra dữ liệu gửi.' }, 400); }

    const phone = clean(input.phone, 30).replace(/[\s.()-]/g, '').replace(/^\+84/, '0');
    const id = clean(input.id, 40);
    const area = clean(input.area, 160);
    const token = clean(input.token, 2048);
    if (!/^0\d{9}$/.test(phone) || area.length < 2 || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      || input.consent !== true || (turnstileSecret && !token) || clean(input.website, 200)) {
      return json({ success: false, message: 'Vui lòng kiểm tra số điện thoại, khu vực và đồng ý liên hệ.' }, 400);
    }
    try {
      if (turnstileSecret && !await deps.verifyToken(token, turnstileSecret, url.hostname)) {
        return json({ success: false, message: 'Xác minh chưa thành công. Vui lòng thử lại.' }, 400);
      }
    } catch { return json({ success: false, message: 'Chưa thể xác minh. Vui lòng thử lại sau.' }, 503); }

    const lead: Lead = { id, phone, area, name: clean(input.name, 100),
      monthly_bill: clean(input.monthly_bill, 60),
      source_path: clean(input.source_path, 300).startsWith('/') ? clean(input.source_path, 300).split('?')[0] : '/',
      utm_source: clean(input.utm_source, 120), utm_medium: clean(input.utm_medium, 120),
      utm_campaign: clean(input.utm_campaign, 120), utm_content: clean(input.utm_content, 120), utm_term: clean(input.utm_term, 120) };
    const emailConfigured = !!(env.WATER_HEATER_RESEND_API_KEY && env.WATER_HEATER_FROM_EMAIL && env.WATER_HEATER_NOTIFY_EMAIL);
    let created = false;
    try {
      const existing = await env.DB.prepare('SELECT id FROM leads WHERE id = ?').bind(lead.id).first<{ id: string }>();
      if (existing) return json({ success: true, created: false, id: lead.id, message: 'Đã nhận yêu cầu. Nhân viên tư vấn sẽ liên hệ với bạn.' });
      const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const recent = await env.DB.prepare("SELECT COUNT(*) AS total FROM leads WHERE phone = ? AND source_path LIKE '/binh-nong-lanh/%' AND created_at >= ?").bind(lead.phone, since).first<{ total: number }>();
      if ((recent?.total || 0) >= 3) return json({ success: false, message: 'Bạn đã gửi nhiều yêu cầu gần đây. Vui lòng chờ ít phút rồi thử lại.' }, 429);
      const result = await env.DB.prepare(`INSERT OR IGNORE INTO leads
        (id, name, phone, area, monthly_bill, source_path, utm_source, utm_medium, utm_campaign, utm_content, utm_term, notification_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(lead.id, lead.name, lead.phone, lead.area, lead.monthly_bill, lead.source_path,
          lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_content, lead.utm_term,
          emailConfigured ? 'pending' : 'not_configured').run();
      if (!result.success) throw new Error('Insert failed');
      created = (result.meta.changes || 0) > 0;
    } catch {
      console.error('Lead could not be persisted');
      return json({ success: false, message: 'Chưa lưu được đăng ký. Vui lòng thử lại hoặc gọi trực tiếp.' }, 503);
    }
    if (created && emailConfigured) {
      const notification = (async () => {
        let status = 'sent';
        try { await deps.notifySales(lead, env); } catch { status = 'failed'; console.error('Sales notification failed'); }
        await env.DB.prepare('UPDATE leads SET notification_status = ? WHERE id = ?').bind(status, lead.id).run();
      })().catch(() => console.error('Notification status update failed'));
      context.waitUntil(notification);
    }
    return json({ success: true, created, id: lead.id, message: 'Đã nhận yêu cầu. Nhân viên tư vấn sẽ liên hệ với bạn.' }, created ? 201 : 200);
  };
}
