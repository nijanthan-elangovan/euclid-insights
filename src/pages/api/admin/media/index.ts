import type { APIRoute } from 'astro';
import { deleteMediaAsset, listMediaAssets, uploadMediaAsset } from '../../../../lib/store';
import { json, requireAdmin } from '../../../../lib/admin-api';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url }) => {
  const guard = requireAdmin(cookies);
  if (guard.error) return guard.error;

  const requestedBucket = url.searchParams.get('bucket')?.toLowerCase() || 'all';
  if (!['all', 'articles', 'covers'].includes(requestedBucket)) {
    return json({ error: 'bucket must be one of: all, articles, covers' }, 400);
  }

  const assets = listMediaAssets(requestedBucket as 'all' | 'articles' | 'covers');
  return json({
    ok: true,
    bucket: requestedBucket,
    count: assets.length,
    assets,
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

  if (typeof body.bucket !== 'string' || !['articles', 'covers'].includes(body.bucket)) {
    return json({ error: 'bucket must be either "articles" or "covers"' }, 400);
  }
  if (typeof body.fileName !== 'string' || !body.fileName.trim()) {
    return json({ error: 'fileName is required' }, 400);
  }
  if (typeof body.contentBase64 !== 'string' || !body.contentBase64.trim()) {
    return json({ error: 'contentBase64 is required' }, 400);
  }

  try {
    const asset = uploadMediaAsset({
      bucket: body.bucket,
      fileName: body.fileName.trim(),
      contentBase64: body.contentBase64.trim(),
    });
    return json({ ok: true, asset }, 201);
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
};

export const DELETE: APIRoute = async ({ cookies, request }) => {
  const guard = requireAdmin(cookies);
  if (guard.error) return guard.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (typeof body.publicPath !== 'string' || !body.publicPath.trim()) {
    return json({ error: 'publicPath is required' }, 400);
  }

  try {
    return json(deleteMediaAsset(body.publicPath.trim()));
  } catch (error) {
    return json({ error: (error as Error).message }, 400);
  }
};
