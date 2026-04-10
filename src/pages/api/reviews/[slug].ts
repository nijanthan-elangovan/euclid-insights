import type { APIRoute } from 'astro';
import { getPreviewSession } from '../../../lib/microsoft-auth';
import { getReview, addApproval, removeApproval, addComment, deleteComment } from '../../../lib/store';

export const prerender = false;

function unauthorized() {
  return new Response('Unauthorized', { status: 401 });
}

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ cookies, params }) => {
  const session = getPreviewSession(cookies);
  if (!session) return unauthorized();
  return json(getReview(params.slug!));
};

export const POST: APIRoute = async ({ cookies, params, request }) => {
  const session = getPreviewSession(cookies);
  if (!session) return unauthorized();

  const body = await request.json();
  const slug = params.slug!;

  switch (body.action) {
    case 'approve':
      return json(addApproval(slug, session.email, session.name));
    case 'unapprove':
      return json(removeApproval(slug, session.email));
    case 'comment':
      if (!body.text?.trim()) return new Response('Comment text required', { status: 400 });
      return json(addComment(slug, session.email, session.name, body.text.trim()));
    case 'deleteComment':
      if (!body.commentId) return new Response('Comment ID required', { status: 400 });
      return json(deleteComment(slug, body.commentId));
    default:
      return new Response('Unknown action', { status: 400 });
  }
};
