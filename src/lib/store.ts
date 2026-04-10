import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA_DIR = join(ROOT, 'data');
const REVIEWS_DIR = join(DATA_DIR, 'reviews');
const ROLES_PATH = join(DATA_DIR, 'roles.json');
const ARTICLES_DIR = join(ROOT, 'src', 'content', 'articles');

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
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

// --- Admin: article frontmatter ---

export function updateArticleFrontmatter(
  articleFile: string,
  updates: Record<string, string>
) {
  const filePath = join(ARTICLES_DIR, articleFile);
  if (!existsSync(filePath)) throw new Error('Article file not found');

  const content = readFileSync(filePath, 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) throw new Error('No frontmatter found');

  let frontmatter = fmMatch[1];

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^(${key}:\\s*)(.*)$`, 'm');
    if (regex.test(frontmatter)) {
      frontmatter = frontmatter.replace(regex, `$1${value}`);
    } else {
      frontmatter += `\n${key}: ${value}`;
    }
  }

  const updated = content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontmatter}\n---`);
  writeFileSync(filePath, updated);
}
