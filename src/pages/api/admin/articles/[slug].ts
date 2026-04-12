import type { APIRoute } from 'astro';
import {
  type ArticleFrontmatterUpdate,
  deleteArticle,
  getArticle,
  publishArticle,
  unpublishArticle,
  updateArticle,
} from '../../../../lib/store';
import { json, requireAdmin } from '../../../../lib/admin-api';

export const prerender = false;

function getSlug(params: Record<string, string | undefined>) {
  const slug = params.slug;
  if (!slug) {
    throw new Error('Missing article slug');
  }
  return slug;
}

export const GET: APIRoute = async ({ cookies, params }) => {
  const guard = requireAdmin(cookies);
  if (guard.error) return guard.error;

  try {
    return json({ ok: true, article: getArticle(getSlug(params)) });
  } catch (error) {
    return json({ error: (error as Error).message }, 404);
  }
};

export const PATCH: APIRoute = async ({ cookies, params, request }) => {
  const guard = requireAdmin(cookies);
  if (guard.error) return guard.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    const updates = body as ArticleFrontmatterUpdate;
    const article = updateArticle(getSlug(params), updates);
    return json({ ok: true, article });
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
};

export const POST: APIRoute = async ({ cookies, params, request }) => {
  const guard = requireAdmin(cookies);
  if (guard.error) return guard.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const action = String(body.action || '').trim().toLowerCase();
  const slug = getSlug(params);

  try {
    if (action === 'publish') {
      const pubDate = typeof body.pubDate === 'string' ? body.pubDate : undefined;
      return json({ ok: true, article: publishArticle(slug, pubDate) });
    }
    if (action === 'unpublish') {
      return json({ ok: true, article: unpublishArticle(slug) });
    }
    if (action === 'schedule') {
      if (typeof body.scheduledDate !== 'string' || !body.scheduledDate.trim()) {
        return json({ error: 'scheduledDate is required for schedule action' }, 400);
      }
      return json({
        ok: true,
        article: updateArticle(slug, {
          status: 'scheduled',
          scheduledDate: body.scheduledDate.trim(),
        }),
      });
    }

    return json({ error: 'Unknown action. Supported: publish, unpublish, schedule' }, 400);
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
};

export const DELETE: APIRoute = async ({ cookies, params }) => {
  const guard = requireAdmin(cookies);
  if (guard.error) return guard.error;

  try {
    return json(deleteArticle(getSlug(params)));
  } catch (error) {
    return json({ error: (error as Error).message }, 404);
  }
};
