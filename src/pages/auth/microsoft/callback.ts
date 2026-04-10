import type { APIRoute, AstroCookies } from 'astro';
import {
  clearPreviewSession,
  exchangeCodeForSession,
  getNonceCookieName,
  getReturnToCookieName,
  getStateCookieName,
  sanitizeReturnTo,
  setPreviewSession,
} from '../../../lib/microsoft-auth';

export const prerender = false;

function clearOAuthCookies(cookies: AstroCookies) {
  cookies.delete(getStateCookieName(), { path: '/' });
  cookies.delete(getReturnToCookieName(), { path: '/' });
  cookies.delete(getNonceCookieName(), { path: '/' });
}

export const GET: APIRoute = async ({ cookies, redirect, request, url }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  const expectedState = cookies.get(getStateCookieName())?.value;
  const expectedNonce = cookies.get(getNonceCookieName())?.value;
  const returnTo = sanitizeReturnTo(cookies.get(getReturnToCookieName())?.value ?? '/');

  if (error) {
    clearOAuthCookies(cookies);
    clearPreviewSession(cookies);
    return new Response(errorDescription || error, { status: 401 });
  }

  if (!code || !state || !expectedState || !expectedNonce || state !== expectedState) {
    clearOAuthCookies(cookies);
    clearPreviewSession(cookies);
    return new Response('Invalid Microsoft sign-in state', { status: 401 });
  }

  try {
    const session = await exchangeCodeForSession(url, code, expectedNonce);
    setPreviewSession(cookies, session, request.url.startsWith('https://'));
    clearOAuthCookies(cookies);
    return redirect(returnTo);
  } catch (exchangeError) {
    clearOAuthCookies(cookies);
    clearPreviewSession(cookies);
    return new Response((exchangeError as Error).message, { status: 401 });
  }
};
