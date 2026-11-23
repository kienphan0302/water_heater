CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  area TEXT NOT NULL,
  monthly_bill TEXT NOT NULL DEFAULT '',
  source_path TEXT NOT NULL DEFAULT '/',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  utm_content TEXT NOT NULL DEFAULT '',
  utm_term TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  notification_status TEXT NOT NULL DEFAULT 'not_configured'
);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
