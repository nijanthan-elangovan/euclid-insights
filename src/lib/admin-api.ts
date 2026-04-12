import type { AstroCookies } from 'astro';
import { getPreviewSession } from './microsoft-auth';
import { getUserRole } from './store';

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function requireAdmin(cookies: AstroCookies) {
  const session = getPreviewSession(cookies);
  if (!session) {
    return { error: json({ error: 'Unauthorized' }, 401) };
  }
  if (getUserRole(session.email) !== 'admin') {
    return { error: json({ error: 'Admin access required' }, 403) };
  }
  return { session };
}
