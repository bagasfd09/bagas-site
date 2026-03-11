# bagas.dev Agent API Contract

You are an AI agent with full read and write access to the bagas.dev portfolio website. This document describes every available API endpoint, how to authenticate, and how to use each one. Follow this contract exactly.

## Base URL

This API is only accessible from the local network. Never expose it to the public internet.

```
http://localhost:3000
```

If the app runs on a different port, adjust accordingly.

## Authentication

Every request MUST include the `Authorization` header:

```
Authorization: Bearer <AGENT_API_KEY>
```

Without this header, all requests return `401 Unauthorized`.

## Response Format

All endpoints return JSON with this consistent structure:

**Success:**
```json
{
  "ok": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "ok": false,
  "error": "Human-readable error message"
}
```

Always check `ok` before reading `data`. If `ok` is `false`, read `error` for the reason.

---

## Step 1: Discover the API

Before doing anything, call the discovery endpoint to confirm the API is reachable and get the latest contract.

```
GET /api/agent
```

This returns the full list of endpoints, parameters, and data models. Use this as your source of truth.

---

## Step 2: Get Site Overview

To understand the current state of the site, start here:

```
GET /api/agent/overview
```

**Returns:**
```json
{
  "ok": true,
  "data": {
    "counts": {
      "posts": 8,
      "notes": 6,
      "projects": 4,
      "skills": 12
    },
    "site": {
      "name": "Bagas",
      "siteName": "bagas.dev",
      "tagline": "Software developer and open-source enthusiast"
    },
    "recentPosts": [
      { "title": "...", "slug": "...", "type": "post", "createdAt": "..." }
    ],
    "recentProjects": [
      { "name": "...", "slug": "...", "updatedAt": "..." }
    ]
  }
}
```

Use this to understand what content already exists before creating or modifying anything.

---

## Step 3: Read Content

### List Posts / Notes

```
GET /api/agent/posts
```

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | `"post,note"` | Filter by type. Values: `"post"`, `"note"`, or `"post,note"` |
| `published` | string | `"all"` | Filter by publish status. Values: `"true"`, `"false"`, `"all"` |
| `limit` | number | `50` | Max results (capped at 100) |
| `offset` | number | `0` | Skip N results for pagination |
| `search` | string | — | Search in title and content (case-insensitive) |

**Example:**
```
GET /api/agent/posts?type=post&published=true&limit=10
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "posts": [ ... ],
    "total": 8
  }
}
```

### Get Single Post

```
GET /api/agent/posts/:slug
```

Returns the full post including `content` (markdown body).

**Example:**
```
GET /api/agent/posts/my-docker-tips
```

### List Projects

```
GET /api/agent/projects
```

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `featured` | string | `"all"` | Filter: `"true"`, `"false"`, `"all"` |
| `limit` | number | `50` | Max results (capped at 100) |

### Get Single Project

```
GET /api/agent/projects/:slug
```

### List Skills

```
GET /api/agent/skills
```

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | — | Filter by category (e.g. `"language"`, `"framework"`, `"tool"`) |

### Get Site Settings

```
GET /api/agent/site
```

Returns all site configuration: name, tagline, bio, social links, section visibility, etc.

---

## Step 4: Read Analytics

### Traffic Analytics (Own Tracking)

```
GET /api/agent/analytics?days=30
```

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `days` | number | `30` | Number of days to look back |

**Response:**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalViews": 2600,
      "uniqueVisitors": 890,
      "todayViews": 45,
      "todayVisitors": 32
    },
    "daily": [
      { "date": "2026-03-01", "views": 85, "visitors": 42 }
    ],
    "countries": [
      { "country": "Indonesia", "code": "ID", "views": 1200 }
    ],
    "topPages": [
      { "path": "/", "views": 482 }
    ],
    "devices": [
      { "device": "Desktop", "pct": 58 },
      { "device": "Mobile", "pct": 34 },
      { "device": "Tablet", "pct": 8 }
    ]
  }
}
```

### Google Search Console (SEO)

```
GET /api/agent/analytics/seo?days=28
```

**Response when configured:**
```json
{
  "ok": true,
  "data": {
    "configured": true,
    "summary": {
      "totalClicks": 320,
      "totalImpressions": 8500,
      "avgCtr": 3.8,
      "avgPosition": 12.4
    },
    "queries": [
      { "query": "bagas dev", "clicks": 45, "impressions": 800, "ctr": 5.6, "position": 3.2 }
    ],
    "pages": [
      { "page": "https://bagas.dev/blog/docker-tips", "clicks": 30, "impressions": 600, "ctr": 5.0, "position": 8.1 }
    ],
    "daily": [
      { "date": "2026-03-01", "clicks": 12, "impressions": 310, "ctr": 3.9, "position": 11.8 }
    ]
  }
}
```

**Response when NOT configured:**
```json
{
  "ok": true,
  "data": { "configured": false }
}
```

Always check `data.configured` before reading SEO data.

---

## Step 5: Write Content

### Create a Post or Note

```
POST /api/agent/posts
Content-Type: application/json
```

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Post title |
| `slug` | string | URL slug (must be unique, use kebab-case) |
| `content` | string | Full markdown body |

**Optional fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | string | `null` | Short excerpt for SEO/cards |
| `icon` | string | `null` | Emoji icon (e.g. `"🐳"`) |
| `tags` | string[] | `[]` | Tag labels |
| `category` | string | `"technical"` | Category name |
| `type` | string | `"post"` | `"post"` for blog, `"note"` for reference notes |
| `published` | boolean | `false` | Set `true` to publish immediately |
| `featured` | boolean | `false` | Show on homepage featured section |

**Example:**
```json
{
  "title": "Docker Tips for Developers",
  "slug": "docker-tips-for-developers",
  "content": "# Docker Tips\n\nHere are some useful tips...",
  "description": "Essential Docker tips every developer should know",
  "icon": "🐳",
  "tags": ["docker", "devops"],
  "category": "technical",
  "type": "post",
  "published": false
}
```

**Important rules:**
- Always check if a slug exists first (`GET /api/agent/posts/:slug`) before creating. Duplicate slugs return `409 Conflict`.
- Create as `published: false` (draft) unless explicitly told to publish.
- Use kebab-case for slugs (e.g. `"my-new-post"`, not `"My New Post"`).

### Update a Post

```
PUT /api/agent/posts/:slug
Content-Type: application/json
```

Only include the fields you want to change. Omitted fields stay unchanged.

**Example — publish a draft:**
```json
{
  "published": true
}
```

**Example — update title and content:**
```json
{
  "title": "Updated Title",
  "content": "# Updated Content\n\nNew body here..."
}
```

**Updatable fields:** `title`, `slug`, `content`, `description`, `icon`, `tags`, `category`, `type`, `published`, `featured`

### Create a Project

```
POST /api/agent/projects
Content-Type: application/json
```

**Required:** `name`, `slug`, `description`

**Optional:** `image`, `demoUrl`, `repo`, `articleUrl`, `tech`, `year`, `featured`, `sortOrder`

**Example:**
```json
{
  "name": "My CLI Tool",
  "slug": "my-cli-tool",
  "description": "A CLI tool for automating deployments",
  "repo": "https://github.com/bagasfd09/my-cli-tool",
  "tech": ["Go", "Docker"],
  "year": 2026,
  "featured": true
}
```

### Update a Project

```
PUT /api/agent/projects/:slug
Content-Type: application/json
```

Partial update — only include fields to change.

**Updatable fields:** `name`, `slug`, `description`, `image`, `demoUrl`, `repo`, `articleUrl`, `tech`, `year`, `featured`, `sortOrder`

### Update Site Settings

```
PUT /api/agent/site
Content-Type: application/json
```

Partial update — only include fields to change.

**Example — update tagline:**
```json
{
  "tagline": "Building things for the web"
}
```

**Updatable fields:** `name`, `siteName`, `tagline`, `heroIntro`, `heroImage`, `cvUrl`, `bio`, `sidebarBio`, `github`, `linkedin`, `twitter`, `email`, `bluesky`, `rssEnabled`, `showExperience`, `showBlog`, `showNotes`, `showSkills`, `showProjects`

---

## Data Models Reference

### Post

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated CUID |
| `title` | string | |
| `slug` | string | Unique, used in URL |
| `content` | string | Markdown body |
| `description` | string \| null | SEO excerpt |
| `icon` | string \| null | Emoji |
| `tags` | string[] | |
| `category` | string | Default: `"technical"` |
| `type` | string | `"post"` or `"note"` |
| `published` | boolean | |
| `featured` | boolean | |
| `createdAt` | string | ISO 8601 datetime |
| `updatedAt` | string | ISO 8601 datetime |

### Project

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated CUID |
| `name` | string | |
| `slug` | string | Unique |
| `description` | string | |
| `image` | string \| null | Image URL |
| `demoUrl` | string \| null | Live demo link |
| `repo` | string \| null | GitHub repo URL |
| `articleUrl` | string \| null | Related blog post |
| `githubStars` | number \| null | Auto-synced from GitHub |
| `githubForks` | number \| null | Auto-synced from GitHub |
| `githubLanguage` | string \| null | Auto-synced from GitHub |
| `tech` | string[] | Technology tags |
| `year` | number \| null | |
| `featured` | boolean | |
| `sortOrder` | number | Lower = first |
| `createdAt` | string | ISO 8601 datetime |
| `updatedAt` | string | ISO 8601 datetime |

### Skill

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `name` | string | |
| `slug` | string | Unique |
| `icon` | string \| null | SVG icon path |
| `url` | string \| null | |
| `category` | string | `"language"`, `"framework"`, `"database"`, `"tool"`, `"cloud"`, `"other"` |
| `level` | string | `"beginner"`, `"intermediate"`, `"advanced"`, `"expert"` |
| `yearsOfExp` | number \| null | |
| `sortOrder` | number | |
| `featured` | boolean | |

### SiteSettings

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Owner's name |
| `siteName` | string | Domain display name |
| `tagline` | string | Subtitle |
| `heroIntro` | string | Homepage hero text |
| `heroImage` | string \| null | Mascot/hero image URL |
| `cvUrl` | string | Resume download URL |
| `bio` | string | Full bio (markdown) |
| `sidebarBio` | string | Short sidebar bio |
| `github` | string | GitHub URL |
| `linkedin` | string | LinkedIn URL |
| `twitter` | string | Twitter URL |
| `email` | string | Email address |
| `bluesky` | string | Bluesky handle |
| `rssEnabled` | boolean | RSS feed toggle |
| `showExperience` | boolean | Section visibility |
| `showBlog` | boolean | Section visibility |
| `showNotes` | boolean | Section visibility |
| `showSkills` | boolean | Section visibility |
| `showProjects` | boolean | Section visibility |

---

## Error Codes

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `400` | Bad request — missing required fields or invalid data |
| `401` | Unauthorized — missing or invalid API key |
| `404` | Not found — slug doesn't exist |
| `409` | Conflict — slug already exists |
| `500` | Server error — something went wrong |

---

## Best Practices

1. **Always read before writing.** Call `GET /api/agent/overview` first to understand existing content.
2. **Check before creating.** Before `POST`, verify the slug doesn't exist with `GET /api/agent/posts/:slug`.
3. **Create as drafts.** Use `published: false` by default. Only publish when content is confirmed ready.
4. **Partial updates only.** When using `PUT`, only send the fields you want to change.
5. **Use kebab-case slugs.** Convert titles to lowercase kebab-case for slugs (e.g. "My Post Title" → "my-post-title").
6. **Check SEO configured.** Before reading SEO data, check `data.configured === true`.
7. **Respect rate limits.** Don't make more than 60 requests per minute.
8. **Read analytics for decisions.** Use traffic and SEO data to inform content strategy — which topics perform well, which pages get traffic.
