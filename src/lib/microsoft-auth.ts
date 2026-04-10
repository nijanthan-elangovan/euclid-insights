import type { AstroCookies } from 'astro';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

type JwtClaims = {
  aud?: string;
  exp?: number;
  email?: string;
  iss?: string;
  name?: string;
  nonce?: string;
  oid?: string;
  preferred_username?: string;
  sub?: string;
  tid?: string;
  upn?: string;
};

export type PreviewSession = {
  email: string;
  expiresAt: number;
  name: string;
  objectId: string;
  tenantId: string;
};

const SESSION_COOKIE = 'euclid_preview_session';
const STATE_COOKIE = 'euclid_preview_oauth_state';
const RETURN_TO_COOKIE = 'euclid_preview_return_to';
const NONCE_COOKIE = 'euclid_preview_oauth_nonce';
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const OAUTH_COOKIE_MAX_AGE = 60 * 10;

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(name: string) {
  return process.env[name]?.trim();
}

function getSessionSecret() {
  return getRequiredEnv('MICROSOFT_SESSION_SECRET');
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function getEmailFromClaims(claims: JwtClaims) {
  return claims.email || claims.preferred_username || claims.upn || '';
}

function getAllowedEmailDomains() {
  return (getOptionalEnv('MICROSOFT_ALLOWED_EMAIL_DOMAINS') || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

function getAllowedEmails() {
  return (getOptionalEnv('MICROSOFT_ALLOWED_EMAILS') || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function getTenantId() {
  return getRequiredEnv('MICROSOFT_TENANT_ID');
}

function getClientId() {
  return getRequiredEnv('MICROSOFT_CLIENT_ID');
}

function getClientSecret() {
  return getRequiredEnv('MICROSOFT_CLIENT_SECRET');
}

function getAllowedTenantId() {
  return getOptionalEnv('MICROSOFT_ALLOWED_TENANT_ID') || getTenantId();
}

function getIssuer() {
  return `https://login.microsoftonline.com/${getTenantId()}/v2.0`;
}

function getRedirectUri(url: URL) {
  return getOptionalEnv('MICROSOFT_REDIRECT_URI') || `${url.origin}/auth/microsoft/callback`;
}

function decodeJwt(token: string): JwtClaims {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Malformed Microsoft ID token');
  }
  return JSON.parse(base64UrlDecode(parts[1]));
}

function validateIdTokenClaims(claims: JwtClaims, expectedNonce: string) {
  if (claims.aud !== getClientId()) {
    throw new Error('Microsoft ID token audience mismatch');
  }
  if (claims.iss !== getIssuer()) {
    throw new Error('Microsoft ID token issuer mismatch');
  }
  if (!claims.exp || claims.exp * 1000 <= Date.now()) {
    throw new Error('Microsoft ID token has expired');
  }
  if (!claims.tid || claims.tid !== getAllowedTenantId()) {
    throw new Error('Microsoft tenant is not allowed');
  }
  if (!claims.nonce || claims.nonce !== expectedNonce) {
    throw new Error('Microsoft ID token nonce mismatch');
  }
}

function validateAllowedIdentity(email: string) {
  const normalizedEmail = email.toLowerCase();
  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length > 0 && allowedEmails.includes(normalizedEmail)) {
    return;
  }

  const allowedDomains = getAllowedEmailDomains();
  if (allowedDomains.length === 0 && allowedEmails.length === 0) {
    return;
  }

  const domain = normalizedEmail.split('@')[1] || '';
  if (!allowedDomains.includes(domain)) {
    throw new Error('Signed-in Microsoft account is not authorized for preview access');
  }
}

function buildSessionCookieValue(session: PreviewSession) {
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function parseSessionCookieValue(value: string | undefined): PreviewSession | null {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const session = JSON.parse(base64UrlDecode(payload)) as PreviewSession;
  if (!session.expiresAt || session.expiresAt <= Date.now()) {
    return null;
  }

  return session;
}

export function assertMicrosoftPreviewConfig() {
  getTenantId();
  getClientId();
  getClientSecret();
  getSessionSecret();
}

export function getMicrosoftAuthorizeUrl(url: URL, state: string, nonce: string) {
  const authorizeUrl = new URL(
    `https://login.microsoftonline.com/${getTenantId()}/oauth2/v2.0/authorize`
  );
  authorizeUrl.searchParams.set('client_id', getClientId());
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('redirect_uri', getRedirectUri(url));
  authorizeUrl.searchParams.set('response_mode', 'query');
  authorizeUrl.searchParams.set('scope', 'openid profile email');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('nonce', nonce);
  return authorizeUrl.toString();
}

export function createOAuthState() {
  return randomBytes(24).toString('base64url');
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getStateCookieName() {
  return STATE_COOKIE;
}

export function getReturnToCookieName() {
  return RETURN_TO_COOKIE;
}

export function getNonceCookieName() {
  return NONCE_COOKIE;
}

export function getOAuthCookieMaxAge() {
  return OAUTH_COOKIE_MAX_AGE;
}

export function getSessionCookieMaxAge() {
  return SESSION_DURATION_SECONDS;
}

export function sanitizeReturnTo(returnTo: string | null) {
  if (!returnTo || !returnTo.startsWith('/')) {
    return '/';
  }
  if (returnTo.startsWith('//')) {
    return '/';
  }
  return returnTo;
}

export async function exchangeCodeForSession(url: URL, code: string, expectedNonce: string) {
  const body = new URLSearchParams({
    client_id: getClientId(),
    client_secret: getClientSecret(),
    code,
    grant_type: 'authorization_code',
    redirect_uri: getRedirectUri(url),
    scope: 'openid profile email',
  });

  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${getTenantId()}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  );

  if (!tokenResponse.ok) {
    throw new Error(`Microsoft token exchange failed with status ${tokenResponse.status}`);
  }

  const tokenPayload = await tokenResponse.json();
  if (!tokenPayload.id_token) {
    throw new Error('Microsoft token response did not include an ID token');
  }

  const claims = decodeJwt(tokenPayload.id_token);
  validateIdTokenClaims(claims, expectedNonce);

  const email = getEmailFromClaims(claims);
  if (!email) {
    throw new Error('Signed-in Microsoft account did not include an email identity');
  }
  validateAllowedIdentity(email);

  return {
    email,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
    name: claims.name || email,
    objectId: claims.oid || claims.sub || email,
    tenantId: claims.tid!,
  } satisfies PreviewSession;
}

export function getPreviewSession(cookies: AstroCookies) {
  return parseSessionCookieValue(cookies.get(SESSION_COOKIE)?.value);
}

export function setPreviewSession(
  cookies: AstroCookies,
  session: PreviewSession,
  secure: boolean
) {
  cookies.set(SESSION_COOKIE, buildSessionCookieValue(session), {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure,
  });
}

export function clearPreviewSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
