export const campaignKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'] as const;
export function campaignForPage(search: string, previous: Record<string,string> = {}): Record<string,string> {
  const params = new URLSearchParams(search);
  const fresh = campaignKeys.some(key => params.has(key));
  return Object.fromEntries(campaignKeys.map(key => [key, String(fresh ? params.get(key) || '' : previous[key] || '').slice(0,120)]));
}
