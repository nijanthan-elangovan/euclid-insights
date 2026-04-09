import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    author: z.string().default('Euclid Innovations'),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    coverImage: z.string().optional(),
    ogImage: z.string().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    wordCount: z.number().optional(),
    readTime: z.string().optional(),
    status: z.enum(['draft', 'review', 'scheduled', 'published']).default('draft'),
    scheduledDate: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    previewToken: z.string().optional(),
  }),
});

export const collections = { articles };
