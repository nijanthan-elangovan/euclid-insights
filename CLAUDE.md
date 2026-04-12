# Euclid Insights - AI Agent Reference Guide

This document serves as the authoritative style and development guide for AI agents (Claude, OpenAI, Cursor, etc.) working on this project.

## Project Overview

Euclid Insights is a thought leadership blog built with **Astro** (hybrid SSR + static) using the `@astrojs/node` adapter. It features Microsoft SSO for preview access, a review/admin panel system, and a WordPress-integrated API.

- **Framework**: Astro with MDX articles
- **Styling**: Tailwind CSS with custom design tokens
- **Deployment**: GitHub Actions CI/CD to Azure VM via PM2
- **Auth**: Microsoft OAuth2/OpenID Connect with HMAC session cookies
- **Data**: JSON file-based store (no database)

---

## Writing Style Guide (Google Developer Documentation Style)

All articles must follow these principles:

### Voice and Tone
- **Second person**: Address the reader as "you/your" — not "organizations" or "enterprises" in the abstract
- **Active voice**: "AI detects fraud" not "Fraud is detected by AI"
- **Present tense**: "This approach gives you" not "This approach will give you"
- **Direct and concise**: Cut filler words, avoid hedging ("actually", "basically", "simply")
- **Confident but not hyperbolic**: State facts, avoid excessive superlatives

### Headings
- **Sentence case**: "The business case for cloud" not "The Business Case for Cloud"
- Exception: proper nouns, acronyms, and product names stay capitalized ("Euclid's MLOps framework")
- H2 for major sections, H3 for subsections — never skip levels

### Formatting
- **Bold** for key terms on first introduction, not for emphasis
- Use em-dash (—) with no spaces for parenthetical statements
- Numbers: spell out one through nine, use numerals for 10+
- Percentages: always use numerals with % symbol (5%, not five percent)

### Content Structure
- Lead with the key insight or takeaway, not background
- Each section should be scannable — use bullet lists, stat cards, and tables to break up prose
- End articles with a clear call-to-action linking to Euclid services

---

## Brand Colors (Tailwind Tokens)

```
euclid-teal:       #0AB3B3   — Primary brand color, links, CTAs
euclid-teal-dark:  #014745   — Dark teal for gradients, H3 headings
euclid-teal-deep:  #087F7F   — Deep teal for hover states
euclid-cyan:       #D3FFFE   — Light cyan for tag pills, backgrounds
euclid-navy:       #273171   — Secondary brand, H2 headings, dark sections
euclid-green:      #61CE70   — Success, positive stats
euclid-pink:       #FFC8C8   — Accent
euclid-gray:       #808285   — Muted text
euclid-gray-light: #F7F8FA   — Section backgrounds
euclid-gray-dark:  #2D2D2D   — Body text, strong emphasis
```

### Gradient
```css
gradient-bg: linear-gradient(135deg, #014745 0%, #273171 50%, #0AB3B3 100%)
```
Used for: footer, card placeholders, dark hero sections.

### Category Colors
| Category | Badge BG | Badge Text | Accent |
|---|---|---|---|
| ai-ml | blue-50 | blue-700 | border-blue-200 |
| digital-transformation | purple-50 | purple-700 | border-purple-200 |
| cloud | sky-50 | sky-700 | border-sky-200 |
| cybersecurity | red-50 | red-700 | border-red-200 |
| talent | green-50 | green-700 | border-green-200 |

---

## Typography

| Usage | Font | Weight | Tailwind Class |
|---|---|---|---|
| Headings, nav, badges | Poppins | 300-700 | `font-poppins` |
| Body text, paragraphs | Roboto | 300-500 | `font-roboto` |
| Blockquotes | Roboto Slab | 400-700 | `font-roboto-slab` |

---

## Logo Usage

| Location | Logo URL | Notes |
|---|---|---|
| Header navbar | `https://euclidinnovations.com/wp-content/uploads/2023/06/Logo-Icon-Transparent-BG.png` | Original logo, white BG, 36x36px |
| Footer | `http://euclidinnovations.com/wp-content/uploads/2023/01/cropped-Logo-Icon-Transparent-shadow.png` | Shadow variant, uses `brightness-200` |
| Favicon | Same as footer logo | `<link rel="icon" type="image/png">` |
| Structured Data | Same as footer logo | JSON-LD publisher logo |
| OG Image default | Same as footer logo | Fallback when no article coverImage |

**Rule**: Never change the header logo without explicit request. The header uses the original clean logo; footer/favicon use the shadow variant.

---

## Cover Images (Article Thumbnails)

### Style Requirements
Cover images follow a **flat geometric monochromatic illustration** style inspired by Euclid's brand:
- Single color palette per image (3-4 shades of one hue)
- Geometric shapes: circles, rectangles, polygons with rounded corners
- **SVG grain texture overlay** using `feTurbulence` filter for tactile feel
- Topic-relevant iconography (abstract, not literal)
- Dimensions: 800x450 viewBox (16:9 aspect ratio)

### Current Cover Images
| Article | File | Color Palette | Key Shapes |
|---|---|---|---|
| AI in Banking | `/images/covers/ai-banking.svg` | Purple (#8B5CC8 → #E8D5F5) | Bank columns + neural network |
| Cloud Enablement | `/images/covers/cloud-enablement.svg` | Green (#1EA84E → #D4F5E0) | Cloud + server rack + upload arrow |
| Cybersecurity | `/images/covers/cybersecurity.svg` | Red/Coral (#D14545 → #FCDADA) | Shield + lock + scanning lines |
| AI Talent | `/images/covers/ai-talent.svg` | Blue (#2B6FA0 → #D5E8F5) | People silhouettes + neural connections |
| Pilot to Production | `/images/covers/pilot-to-production.svg` | Orange (#A83D15 → #FCE0D0) | Pipeline segments + rocket |

### SVG Template Structure
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feBlend in="SourceGraphic" mode="multiply" result="blend"/>
    </filter>
  </defs>
  <g>
    <rect width="800" height="450" fill="[LIGHTEST_SHADE]"/>
    <!-- Topic-specific geometric shapes in 3-4 shades -->
    <!-- Grain overlay MUST be last element -->
    <rect width="800" height="450" filter="url(#grain)" opacity="0.15"/>
  </g>
</svg>
```

### Creating New Cover Images
1. Choose a **single hue** not already used (purple, green, red, blue, orange are taken)
2. Create 4 shades: background (lightest), primary, secondary, darkest
3. Use abstract geometric shapes representing the topic
4. Add decorative floating circles/rectangles with low opacity for depth
5. Always include the grain overlay as the final element
6. Save to `public/images/covers/[slug].svg`

---

## In-Article Stock Images

### Guidelines
- Use **free stock images** (Unsplash, Pexels, Pixabay) — no attribution required
- Download and store locally in `public/images/articles/[descriptive-name].jpg`
- Never hotlink to external image CDNs
- Optimize to ~800px width, JPEG quality 80
- Place images at natural content breaks (between major sections)
- Use rounded corners and shadow via prose styles (automatic) or explicit classes

### Current Stock Images
| File | Topic | Source |
|---|---|---|
| `banking-dashboard.jpg` | Analytics dashboard with charts | Unsplash |
| `cloud-servers.jpg` | Server room with network cables | Unsplash |
| `cybersecurity-lock.jpg` | Code on screen | Unsplash |
| `team-collaboration.jpg` | Dev team working with laptops | Unsplash |
| `ai-production.jpg` | AI robot (Pepper) | Unsplash |

### Image Markup in MDX
```mdx
<img src="/images/articles/image-name.jpg" alt="Descriptive alt text" class="rounded-2xl my-10 w-full" />
```

---

## Article Frontmatter Schema

```yaml
---
title: "Article Title in Title Case"
subtitle: "One-line hook — conversational, not formal"
description: "SEO meta description, 150-160 chars, includes key stat or claim"
author: "Euclid Innovations"
pubDate: 2025-04-01          # ISO date
category: "ai-ml"            # ai-ml | cloud | cybersecurity | talent | digital-transformation
tags: ["Tag1", "Tag2"]       # 4-7 tags, title case
readTime: "9 min"            # Estimated read time
status: "draft"              # draft | review | scheduled | published
featured: false              # Only ONE article should be featured at a time
coverImage: "/images/covers/slug.svg"
seoTitle: "SEO Title | Euclid Insights"
seoDescription: "SEO description for search engines"
previewToken: "preview-slug-year"
---
```

---

## Dark Section Pattern (not-prose)

When placing dark-background sections inside articles, the `.prose-euclid` styles will override text colors to dark gray. **Always add `not-prose` class** to dark containers:

```mdx
<div class="not-prose bg-gradient-to-r from-euclid-teal-dark to-euclid-navy rounded-2xl p-8 text-white my-10">
  <h4 class="font-poppins font-bold text-xl mb-6">Section Title</h4>
  <p class="text-white/80 text-sm">Content here...</p>
</div>
```

---

## Component Library

| Component | File | Usage |
|---|---|---|
| `StatCard` | `src/components/StatCard.astro` | Numeric stat with label and color |
| `InfoTable` | `src/components/InfoTable.astro` | Comparison table with headers and rows |
| `ArticleCard` | `src/components/ArticleCard.astro` | Article listing card with cover image |
| `ReviewPanel` | `src/components/ReviewPanel.astro` | Right-side review panel (preview pages) |
| `AdminPanel` | `src/components/AdminPanel.astro` | Right-side admin panel (preview pages) |
| `RelatedPosts` | `src/components/RelatedPosts.astro` | Related articles section |

---

## Key File Paths

| Purpose | Path |
|---|---|
| Articles | `src/content/articles/*.mdx` |
| Layouts | `src/layouts/BaseLayout.astro`, `ArticleLayout.astro` |
| Global CSS | `src/styles/global.css` |
| Tailwind config | `tailwind.config.mjs` |
| Content schema | `src/content.config.ts` |
| Auth library | `src/lib/microsoft-auth.ts` |
| Data store | `src/lib/store.ts` |
| Roles config | `data/roles.json` |
| Review data | `data/reviews/[slug].json` |
| Cover images | `public/images/covers/*.svg` |
| Stock images | `public/images/articles/*.jpg` |
| Nginx config | `nginx.conf` |
| PM2 config | `ecosystem.config.cjs` |
| Deploy workflow | `.github/workflows/deploy.yml` |
