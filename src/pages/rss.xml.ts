import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles', ({ data }) => {
    return data.status === 'published';
  });

  const sorted = articles.sort(
    (a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );

  return rss({
    title: 'Euclid Insights — AI & Technology Thought Leadership',
    description: 'Expert insights on AI, Cloud, Cybersecurity, and Digital Transformation from Euclid Innovations.',
    site: context.site!,
    items: sorted.map((article) => ({
      title: article.data.title,
      pubDate: article.data.pubDate,
      description: article.data.description,
      link: `/articles/${article.id}`,
      categories: [article.data.category, ...article.data.tags],
    })),
    customData: `<language>en-us</language>
<image>
  <url>https://euclidinnovations.com/wp-content/uploads/2023/06/Logo-Icon-Transparent-BG.png</url>
  <title>Euclid Insights</title>
  <link>https://insights.euclidinnovations.com</link>
</image>`,
  });
}
