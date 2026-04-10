import type { APIRoute } from 'astro';
import { clearPreviewSession, sanitizeReturnTo } from '../../../lib/microsoft-auth';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  clearPreviewSession(cookies);
  return redirect(sanitizeReturnTo(url.searchParams.get('returnTo')));
};
