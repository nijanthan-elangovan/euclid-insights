import type { APIRoute } from 'astro';
import { json, requireAdmin } from '../../../lib/admin-api';
import { type ArticleFrontmatterUpdate, updateArticle } from '../../../lib/store';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, params, request }) => {
  const guard = requireAdmin(cookies);
  if (guard.error) return guard.error;

  const body = await request.json();
  const slug = params.slug!;
  const allowed = [
    'title',
    'subtitle',
    'description',
    'author',
    'pubDate',
    'updatedDate',
    'category',
    'tags',
    'wordCount',
    'readTime',
    'status',
    'scheduledDate',
    'featured',
    'coverImage',
    'ogImage',
    'seoTitle',
    'seoDescription',
    'previewToken',
  ] as const;
  const updates: ArticleFrontmatterUpdate = {};

  for (const key of allowed) {
    if (body[key] !== undefined) {
      (updates as Record<string, unknown>)[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return json({ error: 'No valid fields to update' }, 400);
  }

  try {
    const article = updateArticle(slug, updates);
    return json({
      ok: true,
      slug: article.slug,
      updated: Object.keys(updates),
      article,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
};
