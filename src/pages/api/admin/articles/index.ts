import type { APIRoute } from 'astro';
import { createArticle, listArticles, type ArticleStatus } from '../../../../lib/store';
import { json, requireAdmin } from '../../../../lib/admin-api';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const guard = requireAdmin(cookies);
  if (guard.error) return guard.error;

  const articles = listArticles();
  return json({
    ok: true,
    count: articles.length,
    articles,
  });
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const guard = requireAdmin(cookies);
  if (guard.error) return guard.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.title || typeof body.title !== 'string') {
    return json({ error: 'Field "title" is required' }, 400);
  }

  try {
    const article = createArticle({
      slug: typeof body.slug === 'string' ? body.slug : undefined,
      title: body.title,
      description: typeof body.description === 'string' ? body.description : undefined,
      category: typeof body.category === 'string' ? body.category : undefined,
      status: typeof body.status === 'string' ? (body.status as ArticleStatus) : undefined,
      pubDate: typeof body.pubDate === 'string' ? body.pubDate : undefined,
      author: typeof body.author === 'string' ? body.author : undefined,
      previewToken: typeof body.previewToken === 'string' ? body.previewToken : undefined,
    });

    return json({ ok: true, article }, 201);
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
};
