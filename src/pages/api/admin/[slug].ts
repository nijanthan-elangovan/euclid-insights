import type { APIRoute } from 'astro';
import { getPreviewSession } from '../../../lib/microsoft-auth';
import { getUserRole, updateArticleFrontmatter } from '../../../lib/store';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ cookies, params, request }) => {
  const session = getPreviewSession(cookies);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  if (getUserRole(session.email) !== 'admin') {
    return json({ error: 'Admin access required' }, 403);
  }

  const body = await request.json();
  const slug = params.slug!;
  const articleFile = `${slug}.mdx`;

  const allowed = ['status', 'pubDate', 'previewToken'] as const;
  const updates: Record<string, string> = {};

  for (const key of allowed) {
    if (body[key] !== undefined) {
      const val = body[key];
      if (key === 'status' && !['draft', 'review', 'scheduled', 'published'].includes(val)) {
        return json({ error: `Invalid status: ${val}` }, 400);
      }
      updates[key] = typeof val === 'string' && !val.includes('"') ? `"${val}"` : String(val);
    }
  }

  if (body.pubDate !== undefined) {
    updates.pubDate = body.pubDate;
  }

  if (Object.keys(updates).length === 0) {
    return json({ error: 'No valid fields to update' }, 400);
  }

  try {
    updateArticleFrontmatter(articleFile, updates);
    return json({ ok: true, updated: Object.keys(updates) });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
};
