import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const articles = await getCollection('articles', ({ data }) => {
    return data.status === 'published';
  });

  const sorted = articles
    .sort((a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime())
    .slice(0, 3);

  const posts = sorted.map((article) => ({
    id: article.id,
    title: article.data.title,
    description: article.data.description,
    category: article.data.category,
    tags: article.data.tags,
    pubDate: article.data.pubDate,
    readTime: article.data.readTime || null,
    coverImage: article.data.coverImage || null,
    url: `https://insights.euclidinnovations.com/articles/${article.id}`,
    author: article.data.author,
  }));

  return new Response(JSON.stringify({
    success: true,
    count: posts.length,
    posts,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
