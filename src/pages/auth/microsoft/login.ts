import type { APIRoute } from 'astro';
import {
  assertMicrosoftPreviewConfig,
  createOAuthState,
  getMicrosoftAuthorizeUrl,
  getNonceCookieName,
  getOAuthCookieMaxAge,
  getReturnToCookieName,
  getStateCookieName,
  sanitizeReturnTo,
} from '../../../lib/microsoft-auth';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect, request, url }) => {
  try {
    assertMicrosoftPreviewConfig();
  } catch (error) {
    return new Response((error as Error).message, { status: 500 });
  }

  const returnTo = sanitizeReturnTo(url.searchParams.get('returnTo'));
  const state = createOAuthState();
  const nonce = createOAuthState();
  const secure = request.url.startsWith('https://');

  cookies.set(getStateCookieName(), state, {
    httpOnly: true,
    maxAge: getOAuthCookieMaxAge(),
    path: '/',
    sameSite: 'lax',
    secure,
  });
  cookies.set(getReturnToCookieName(), returnTo, {
    httpOnly: true,
    maxAge: getOAuthCookieMaxAge(),
    path: '/',
    sameSite: 'lax',
    secure,
  });
  cookies.set(getNonceCookieName(), nonce, {
    httpOnly: true,
    maxAge: getOAuthCookieMaxAge(),
    path: '/',
    sameSite: 'lax',
    secure,
  });

  return redirect(getMicrosoftAuthorizeUrl(url, state, nonce));
};
