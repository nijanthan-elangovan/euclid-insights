import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { join, dirname, extname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

function resolveProjectRoot() {
  const envRoot = process.env.EUCLID_INSIGHTS_ROOT?.trim();
  if (envRoot) return resolve(envRoot);

  const cwdRoot = process.cwd();
  if (existsSync(join(cwdRoot, 'data', 'roles.json'))) {
    return cwdRoot;
  }

  // Fallback for local source execution.
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

const ROOT = resolveProjectRoot();
const DATA_DIR = join(ROOT, 'data');
const REVIEWS_DIR = join(DATA_DIR, 'reviews');
const ROLES_PATH = join(DATA_DIR, 'roles.json');
const ARTICLES_DIR = join(ROOT, 'src', 'content', 'articles');
const PUBLIC_IMAGES_DIR = join(ROOT, 'public', 'images');
const ARTICLES_IMAGES_DIR = join(PUBLIC_IMAGES_DIR, 'articles');
const COVERS_IMAGES_DIR = join(PUBLIC_IMAGES_DIR, 'covers');
const ARTICLE_FILE_EXTENSIONS = new Set(['.md', '.mdx']);
const ARTICLE_STATUSES = ['draft', 'review', 'scheduled', 'published'] as const;
const FRONTMATTER_KEY_ORDER = [
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

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function isSafeSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeDate(value = new Date()) {
  return value.toISOString().split('T')[0];
}

function assertSafeSlug(slug: string) {
  if (!isSafeSlug(slug)) {
    throw new Error('Invalid slug. Use lowercase letters, numbers, and dashes only.');
  }
}

function splitArticleFileName(articleFile: string) {
  const parsed = articleFile.trim().toLowerCase();
  const ext = extname(parsed);
  const slug = ext ? parsed.slice(0, -ext.length) : parsed;
  assertSafeSlug(slug);
  return { slug, ext: ext || '.mdx' };
}

function articlePathFromSlug(slug: string) {
  assertSafeSlug(slug);
  const mdxPath = join(ARTICLES_DIR, `${slug}.mdx`);
  const mdPath = join(ARTICLES_DIR, `${slug}.md`);
  if (existsSync(mdxPath)) return mdxPath;
  if (existsSync(mdPath)) return mdPath;
  return mdxPath;
}

function ensurePathWithin(basePath: string, candidatePath: string) {
  const rel = relative(resolve(basePath), resolve(candidatePath));
  return rel !== '' && !rel.startsWith('..') && !rel.includes(':');
}

function isMediaFolder(bucket: string): bucket is MediaBucket {
  return bucket === 'articles' || bucket === 'covers';
}

function getMediaBucketDirectory(bucket: MediaBucket) {
  return bucket === 'articles' ? ARTICLES_IMAGES_DIR : COVERS_IMAGES_DIR;
}

function extractFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('No frontmatter found');
  return { raw: match[0], block: match[1] };
}

function parsePrimitiveFrontmatterValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function parseFrontmatter(frontmatterBlock: string) {
  const data: Record<string, unknown> = {};
  const keyOrder: string[] = [];

  for (const line of frontmatterBlock.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    data[key] = parsePrimitiveFrontmatterValue(value);
    keyOrder.push(key);
  }

  return { data, keyOrder };
}

function serializeFrontmatterValue(value: unknown) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => JSON.stringify(String(item))).join(', ')}]`;
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  return JSON.stringify(String(value ?? ''));
}

function sortFrontmatterKeys(keys: string[]) {
  const preferred = FRONTMATTER_KEY_ORDER.filter((key) => keys.includes(key));
  const extra = keys.filter((key) => !FRONTMATTER_KEY_ORDER.includes(key as never));
  return [...preferred, ...extra];
}

function serializeFrontmatter(
  data: Record<string, unknown>,
  previousOrder: string[] = []
) {
  const finalOrder = sortFrontmatterKeys(
    Array.from(new Set([...previousOrder, ...Object.keys(data)]))
  );
  return finalOrder
    .filter((key) => data[key] !== undefined)
    .map((key) => `${key}: ${serializeFrontmatterValue(data[key])}`)
    .join('\n');
}

function readArticle(slug: string) {
  const filePath = articlePathFromSlug(slug);
  if (!existsSync(filePath)) {
    throw new Error(`Article "${slug}" not found`);
  }
  const fileName = filePath.split(/[/\\]/).pop() || `${slug}.mdx`;
  const content = readFileSync(filePath, 'utf8');
  const frontmatter = extractFrontmatter(content);
  const parsed = parseFrontmatter(frontmatter.block);
  return {
    slug,
    fileName,
    filePath,
    content,
    frontmatterRaw: frontmatter.raw,
    frontmatterData: parsed.data,
    frontmatterKeyOrder: parsed.keyOrder,
  };
}

function saveArticleFrontmatter(
  filePath: string,
  content: string,
  originalFrontmatter: string,
  data: Record<string, unknown>,
  previousKeyOrder: string[]
) {
  const serialized = `---\n${serializeFrontmatter(data, previousKeyOrder)}\n---`;
  const updatedContent = content.replace(originalFrontmatter, serialized);
  writeFileSync(filePath, updatedContent, 'utf8');
}

// --- Roles ---

type RolesFile = { roles: Record<string, string>; defaultRole: string };

function readRoles(): RolesFile {
  try {
    return JSON.parse(readFileSync(ROLES_PATH, 'utf8'));
  } catch {
    return { roles: {}, defaultRole: 'reviewer' };
  }
}

export function getUserRole(email: string): 'admin' | 'reviewer' {
  const data = readRoles();
  const role = data.roles[email.toLowerCase()];
  if (role === 'admin') return 'admin';
  return (data.defaultRole as 'admin' | 'reviewer') || 'reviewer';
}

// --- Reviews ---

export type ReviewComment = {
  id: string;
  email: string;
  name: string;
  text: string;
  createdAt: string;
};

export type ReviewData = {
  slug: string;
  approved: { email: string; name: string; at: string }[];
  comments: ReviewComment[];
};

function reviewPath(slug: string) {
  return join(REVIEWS_DIR, `${slug}.json`);
}

export function getReview(slug: string): ReviewData {
  try {
    return JSON.parse(readFileSync(reviewPath(slug), 'utf8'));
  } catch {
    return { slug, approved: [], comments: [] };
  }
}

function saveReview(data: ReviewData) {
  ensureDir(REVIEWS_DIR);
  writeFileSync(reviewPath(data.slug), JSON.stringify(data, null, 2));
}

export function addApproval(slug: string, email: string, name: string) {
  const data = getReview(slug);
  if (!data.approved.some((a) => a.email === email)) {
    data.approved.push({ email, name, at: new Date().toISOString() });
    saveReview(data);
  }
  return data;
}

export function removeApproval(slug: string, email: string) {
  const data = getReview(slug);
  data.approved = data.approved.filter((a) => a.email !== email);
  saveReview(data);
  return data;
}

export function addComment(slug: string, email: string, name: string, text: string) {
  const data = getReview(slug);
  data.comments.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    name,
    text,
    createdAt: new Date().toISOString(),
  });
  saveReview(data);
  return data;
}

export function deleteComment(slug: string, commentId: string) {
  const data = getReview(slug);
  data.comments = data.comments.filter((c) => c.id !== commentId);
  saveReview(data);
  return data;
}

// --- Admin: article frontmatter and lifecycle ---

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export type ArticleSummary = {
  slug: string;
  fileName: string;
  title: string;
  description: string;
  category: string;
  status: ArticleStatus;
  pubDate: string;
  updatedDate?: string;
  featured: boolean;
  previewToken?: string;
  coverImage?: string;
};

export type ManagedArticle = ArticleSummary & {
  frontmatter: Record<string, unknown>;
  body: string;
};

export type ArticleFrontmatterUpdate = Partial<{
  title: string;
  subtitle: string;
  description: string;
  author: string;
  pubDate: string;
  updatedDate: string;
  category: string;
  tags: string[];
  wordCount: number;
  readTime: string;
  status: ArticleStatus;
  scheduledDate: string;
  featured: boolean;
  coverImage: string;
  ogImage: string;
  seoTitle: string;
  seoDescription: string;
  previewToken: string;
}>;

export type CreateArticleInput = {
  slug?: string;
  title: string;
  description?: string;
  category?: string;
  status?: ArticleStatus;
  pubDate?: string;
  author?: string;
  previewToken?: string;
};

function toArticleStatus(value: unknown): ArticleStatus {
  const normalized = String(value || '').toLowerCase();
  if (ARTICLE_STATUSES.includes(normalized as ArticleStatus)) {
    return normalized as ArticleStatus;
  }
  return 'draft';
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((entry) => String(entry));
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeUpdateValue(key: keyof ArticleFrontmatterUpdate, value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return undefined;

  switch (key) {
    case 'status': {
      const status = toArticleStatus(value);
      if (!ARTICLE_STATUSES.includes(status)) {
        throw new Error(`Invalid status: ${String(value)}`);
      }
      return status;
    }
    case 'featured':
      return toBoolean(value);
    case 'wordCount':
      return Number(value);
    case 'tags':
      return toStringArray(value);
    default:
      return String(value).trim();
  }
}

function normalizeArticleSummary(slug: string, fileName: string, frontmatter: Record<string, unknown>) {
  return {
    slug,
    fileName,
    title: String(frontmatter.title || slug),
    description: String(frontmatter.description || ''),
    category: String(frontmatter.category || ''),
    status: toArticleStatus(frontmatter.status),
    pubDate: String(frontmatter.pubDate || normalizeDate(new Date(0))),
    updatedDate: frontmatter.updatedDate ? String(frontmatter.updatedDate) : undefined,
    featured: toBoolean(frontmatter.featured),
    previewToken: frontmatter.previewToken ? String(frontmatter.previewToken) : undefined,
    coverImage: frontmatter.coverImage ? String(frontmatter.coverImage) : undefined,
  } satisfies ArticleSummary;
}

export function listArticles() {
  ensureDir(ARTICLES_DIR);
  const files = readdirSync(ARTICLES_DIR)
    .filter((entry) => ARTICLE_FILE_EXTENSIONS.has(extname(entry).toLowerCase()))
    .sort();

  return files
    .map((fileName) => {
      const slug = fileName.replace(/\.(md|mdx)$/i, '');
      const article = readArticle(slug);
      return normalizeArticleSummary(slug, fileName, article.frontmatterData);
    })
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

export function getArticle(slug: string): ManagedArticle {
  const article = readArticle(slug);
  const summary = normalizeArticleSummary(slug, article.fileName, article.frontmatterData);
  const body = article.content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  return {
    ...summary,
    frontmatter: article.frontmatterData,
    body,
  };
}

export function createArticle(input: CreateArticleInput): ManagedArticle {
  const candidateSlug = input.slug ? slugify(input.slug) : slugify(input.title);
  if (!candidateSlug) {
    throw new Error('Unable to derive slug from title');
  }
  assertSafeSlug(candidateSlug);

  const targetPath = articlePathFromSlug(candidateSlug);
  if (existsSync(targetPath)) {
    throw new Error(`Article "${candidateSlug}" already exists`);
  }

  const now = normalizeDate();
  const frontmatter: Record<string, unknown> = {
    title: input.title.trim(),
    subtitle: '',
    description: input.description?.trim() || '',
    author: input.author?.trim() || 'Euclid Innovations',
    pubDate: input.pubDate?.trim() || now,
    category: input.category?.trim() || 'ai-ml',
    tags: [],
    readTime: '5 min',
    status: toArticleStatus(input.status || 'draft'),
    featured: false,
    coverImage: '',
    seoTitle: '',
    seoDescription: '',
    previewToken: input.previewToken?.trim() || `preview-${candidateSlug}-${new Date().getFullYear()}`,
  };

  const template = `---\n${serializeFrontmatter(frontmatter, [...FRONTMATTER_KEY_ORDER])}\n---\n\n## Introduction\n\nWrite your article content here.\n`;
  ensureDir(ARTICLES_DIR);
  writeFileSync(targetPath, template, 'utf8');

  return getArticle(candidateSlug);
}

export function updateArticle(slug: string, updates: ArticleFrontmatterUpdate): ManagedArticle {
  const article = readArticle(slug);
  const updatedFrontmatter = { ...article.frontmatterData };

  for (const [key, rawValue] of Object.entries(updates) as [
    keyof ArticleFrontmatterUpdate,
    unknown,
  ][]) {
    const normalized = normalizeUpdateValue(key, rawValue);
    if (normalized === undefined) {
      delete updatedFrontmatter[key];
      continue;
    }
    updatedFrontmatter[key] = normalized;
  }

  saveArticleFrontmatter(
    article.filePath,
    article.content,
    article.frontmatterRaw,
    updatedFrontmatter,
    article.frontmatterKeyOrder
  );

  return getArticle(slug);
}

export function deleteArticle(slug: string) {
  const article = readArticle(slug);
  unlinkSync(article.filePath);
  return { ok: true, slug };
}

export function publishArticle(slug: string, pubDate = normalizeDate()) {
  return updateArticle(slug, { status: 'published', pubDate });
}

export function unpublishArticle(slug: string) {
  return updateArticle(slug, { status: 'draft' });
}

// Legacy compatibility method used by existing admin endpoint.

export function updateArticleFrontmatter(
  articleFile: string,
  updates: Record<string, string>
) {
  const { slug } = splitArticleFileName(articleFile);
  const normalizedUpdates: ArticleFrontmatterUpdate = {};
  const allowedKeys = new Set<keyof ArticleFrontmatterUpdate>([
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
  ]);

  for (const [key, rawValue] of Object.entries(updates)) {
    if (!allowedKeys.has(key as keyof ArticleFrontmatterUpdate)) continue;
    const trimmed = String(rawValue).trim();
    let value: unknown = trimmed;

    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      value = trimmed.slice(1, -1);
    }
    if (trimmed === 'true' || trimmed === 'false') {
      value = trimmed === 'true';
    } else if (/^-?\d+$/.test(trimmed)) {
      value = Number(trimmed);
    } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        value = JSON.parse(trimmed);
      } catch {
        value = trimmed;
      }
    }

    (normalizedUpdates as Record<string, unknown>)[key] = value;
  }

  updateArticle(slug, normalizedUpdates);
}

// --- Media assets ---

export type MediaBucket = 'articles' | 'covers';

export type MediaAsset = {
  bucket: MediaBucket;
  fileName: string;
  publicPath: string;
  contentType: string;
  size: number;
  updatedAt: string;
};

export type UploadMediaInput = {
  bucket: MediaBucket;
  fileName: string;
  contentBase64: string;
};

function inferContentType(fileName: string) {
  const ext = extname(fileName).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

function validateMediaPathPart(pathPart: string) {
  if (!pathPart || pathPart.includes('..') || pathPart.startsWith('/')) {
    throw new Error('Invalid media path');
  }
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(pathPart)) {
    throw new Error('Unsupported characters in media path');
  }
}

function walkFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function toMediaAsset(filePath: string, bucket: MediaBucket): MediaAsset {
  const bucketRoot = getMediaBucketDirectory(bucket);
  const relPath = relative(bucketRoot, filePath).replace(/\\/g, '/');
  const stats = statSync(filePath);
  return {
    bucket,
    fileName: relPath,
    publicPath: `/images/${bucket}/${relPath}`,
    contentType: inferContentType(filePath),
    size: stats.size,
    updatedAt: stats.mtime.toISOString(),
  };
}

export function listMediaAssets(bucket: MediaBucket | 'all' = 'all') {
  const buckets: MediaBucket[] = bucket === 'all' ? ['articles', 'covers'] : [bucket];
  const assets = buckets.flatMap((selectedBucket) => {
    const root = getMediaBucketDirectory(selectedBucket);
    ensureDir(root);
    const files = walkFiles(root);
    return files.map((filePath) => toMediaAsset(filePath, selectedBucket));
  });

  return assets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function uploadMediaAsset(input: UploadMediaInput) {
  if (!isMediaFolder(input.bucket)) {
    throw new Error('Invalid media bucket');
  }
  validateMediaPathPart(input.fileName);

  const bucketRoot = getMediaBucketDirectory(input.bucket);
  const destination = resolve(bucketRoot, input.fileName);

  if (!ensurePathWithin(bucketRoot, destination)) {
    throw new Error('Invalid upload destination');
  }

  ensureDir(dirname(destination));
  const buffer = Buffer.from(input.contentBase64, 'base64');
  if (!buffer.byteLength) {
    throw new Error('Empty file content');
  }
  writeFileSync(destination, buffer);
  return toMediaAsset(destination, input.bucket);
}

export function deleteMediaAsset(publicPath: string) {
  const cleaned = publicPath.trim();
  const match = cleaned.match(/^\/images\/(articles|covers)\/(.+)$/);
  if (!match) {
    throw new Error('Invalid media path. Expected /images/articles/... or /images/covers/...');
  }

  const bucket = match[1] as MediaBucket;
  const fileName = match[2];
  validateMediaPathPart(fileName);

  const bucketRoot = getMediaBucketDirectory(bucket);
  const target = resolve(bucketRoot, fileName);
  if (!ensurePathWithin(bucketRoot, target)) {
    throw new Error('Invalid media path');
  }
  if (!existsSync(target)) {
    throw new Error('Media asset not found');
  }

  unlinkSync(target);
  return { ok: true, publicPath };
}
