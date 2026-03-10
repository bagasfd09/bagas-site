import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  })
  console.log('✅ Admin user created')

  // Site Settings
  await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {
      heroIntro:
        "I'm a software developer and open-source enthusiast from Indonesia. I build modern web apps, write long-form tutorials, and occasionally share thoughts on this blog.",
    },
    create: {
      id: 'main',
      name: 'Bagas',
      siteName: 'bagas.dev',
      tagline: 'Software developer and open-source enthusiast',
      heroIntro:
        "I'm a software developer and open-source enthusiast from Indonesia. I build modern web apps, write long-form tutorials, and occasionally share thoughts on this blog.",
      sidebarBio:
        "I'm Bagas, software developer and open-source enthusiast from Indonesia. This is my digital garden. 🌱",
      bio: `# About Me

Hi, I'm **Bagas** — a software developer from Indonesia with a passion for building clean, functional web applications.

## What I Do

I work primarily with the JavaScript/TypeScript ecosystem, building full-stack applications from the database layer up to polished user interfaces. My main tools are **Next.js**, **Fastify**, **Prisma**, and **React** with **Tailwind CSS**.

Currently, I'm focused on building a comprehensive **QA Dashboard** — a platform for managing test runs, test cases, and release cycles. It's been a great challenge working through performance optimization, intuitive UI design, and real-time notifications.

## Tech Stack

**Languages:** TypeScript, JavaScript, Python

**Frontend:** Next.js, React, Tailwind CSS, CSS Modules

**Backend:** Fastify, Node.js, REST APIs

**Database:** PostgreSQL, Prisma ORM

**Tools:** Git, Docker, VS Code, Postman

## Beyond Coding

When I'm not coding, you'll find me:

- 🎮 Playing RPGs — I love a good story-driven game
- 🐱 Spending time with my orange tabby cat
- 📹 Thinking about starting a coding-focused YouTube or TikTok channel (maybe one day!)
- ☕ Drinking too much coffee

## Let's Connect

I'm always happy to chat about tech, projects, or anything else. Feel free to reach out!

- **GitHub:** [github.com/bagas](https://github.com/bagas)
- **LinkedIn:** [linkedin.com/in/bagas](https://linkedin.com/in/bagas)
- **Twitter:** [@bagas](https://twitter.com/bagas)
- **Email:** bagas@example.com
`,
      github: 'https://github.com/bagas',
      linkedin: 'https://linkedin.com/in/bagas',
      twitter: 'https://twitter.com/bagas',
      email: 'bagas@example.com',
      bluesky: '',
      rssEnabled: true,
    },
  })
  console.log('✅ Site settings created')

  // Blog Posts
  const posts = [
    {
      title: 'Building a QA Dashboard from Scratch',
      slug: 'building-qa-dashboard',
      icon: '🧪',
      description:
        'How I designed and built a comprehensive QA Dashboard with test runs, test cases, and performance optimization.',
      content: `# Building a QA Dashboard from Scratch

Building a QA Dashboard is one of those projects that looks straightforward at first, but quickly reveals its complexity as you dig deeper.

## The Problem

Our team needed a centralized place to manage:
- Test runs and their results
- Test cases organized by feature area
- Release management and tracking
- Notification alerts for failures

## Tech Stack

I went with **Next.js** for the frontend and **Fastify** for the backend API. **Prisma** handles database access, and **PostgreSQL** stores everything.

## Architecture

\`\`\`
Frontend (Next.js) → API (Fastify) → Database (PostgreSQL via Prisma)
\`\`\`

## Key Challenges

### Performance
With thousands of test cases, pagination and query optimization became critical early on. I added proper indexes and implemented cursor-based pagination.

### Real-time Updates
Test runs needed live status updates. I implemented WebSocket connections for this.

## Lessons Learned

Building this taught me a lot about balancing feature richness with performance, and how important it is to design the data model correctly from the start.
`,
      tags: ['Next.js', 'Fastify', 'Prisma'],
      category: 'technical',
      type: 'post',
      published: true,
      featured: true,
      createdAt: new Date('2026-02-15'),
    },
    {
      title: 'Why I Chose Fastify Over Express',
      slug: 'fastify-over-express',
      icon: '⚡',
      description:
        'A deep dive into my decision to use Fastify for the backend.',
      content: `# Why I Chose Fastify Over Express

When starting a new Node.js backend project, the first question is always: Express, Fastify, or something else?

## The Case for Fastify

After years of using Express, I switched to Fastify and haven't looked back. Here's why:

### Performance
Fastify is significantly faster than Express in benchmarks — we're talking 2-3x on some routes. For a high-traffic API, this matters.

### Schema Validation
Built-in JSON Schema validation means I can declare my request/response shapes and get automatic validation + serialization for free.

\`\`\`typescript
fastify.get('/users/:id', {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  // request.params.id is validated
})
\`\`\`

### Plugin System
The Fastify plugin system with \`fastify-plugin\` is more organized than Express middleware.

## When Express Still Wins

Express has a much larger ecosystem and more tutorials. If you're building something quick or need a specific middleware, Express might still be the right choice.
`,
      tags: ['Node.js', 'Fastify', 'Backend'],
      category: 'technical',
      type: 'post',
      published: true,
      featured: false,
      createdAt: new Date('2026-01-20'),
    },
    {
      title: 'Designing a 2-Level Sidebar in React',
      slug: 'two-level-sidebar',
      icon: '🧩',
      description:
        'Building an intuitive navigation with a collapsible 2-level sidebar.',
      content: `# Designing a 2-Level Sidebar in React

Navigation design is often underestimated. A good sidebar can make a complex app feel simple; a bad one makes even simple apps feel confusing.

## The Requirements

For the QA Dashboard, I needed:
- Top-level sections (Test Runs, Projects, Settings)
- Sub-items within each section
- Collapsible groups
- Active state highlighting
- Keyboard accessible

## The Component Structure

\`\`\`tsx
<Sidebar>
  <SidebarGroup label="Testing">
    <SidebarItem href="/runs" icon={<PlayIcon />}>Test Runs</SidebarItem>
    <SidebarItem href="/cases" icon={<ListIcon />}>Test Cases</SidebarItem>
  </SidebarGroup>
  <SidebarGroup label="Releases">
    <SidebarItem href="/releases" icon={<TagIcon />}>Releases</SidebarItem>
  </SidebarGroup>
</Sidebar>
\`\`\`

## State Management

The expanded/collapsed state lives in localStorage so it persists across page refreshes.

## Accessibility

Each group header has \`aria-expanded\` and \`aria-controls\`, and keyboard users can navigate with arrow keys.
`,
      tags: ['React', 'UI/UX', 'Component'],
      category: 'technical',
      type: 'post',
      published: true,
      featured: false,
      createdAt: new Date('2025-12-10'),
    },
    {
      title: 'Authentication Patterns for Modern Web Apps',
      slug: 'auth-patterns',
      icon: '🔐',
      description:
        'Exploring different auth strategies and implementing a robust auth system.',
      content: `# Authentication Patterns for Modern Web Apps

Authentication is one of those topics where there are many ways to do it, and the "right" way depends heavily on your context.

## The Options

### Session-Based Auth
The classic approach. Server stores session data; client gets a session ID cookie.

**Pros:** Simple to invalidate, server has full control
**Cons:** Doesn't scale horizontally without session sharing

### JWT (JSON Web Tokens)
Stateless tokens signed by the server.

**Pros:** Stateless, scales well, can be used across services
**Cons:** Hard to invalidate before expiry

### OAuth / Social Login
Delegate auth to a provider (Google, GitHub, etc.)

**Pros:** No password management, trusted providers
**Cons:** Dependency on third party

## What I Chose

For most of my projects, I use **JWT with HTTP-only cookies**. This gives:
- Stateless scaling benefits of JWT
- XSS protection from HTTP-only cookies
- CSRF protection with SameSite=Lax

\`\`\`typescript
// Set JWT in HTTP-only cookie
response.setCookie('token', jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
})
\`\`\`
`,
      tags: ['Auth', 'Security', 'TypeScript'],
      category: 'technical',
      type: 'post',
      published: true,
      featured: false,
      createdAt: new Date('2025-11-05'),
    },
    {
      title: 'Getting Started with Prisma ORM',
      slug: 'prisma-orm-guide',
      icon: '🗄️',
      description: 'A practical guide to setting up and using Prisma ORM.',
      content: `# Getting Started with Prisma ORM

Prisma is my favorite way to work with databases in TypeScript projects. It gives you a type-safe query API that's both intuitive and powerful.

## Setup

\`\`\`bash
npm install prisma @prisma/client
npx prisma init
\`\`\`

## Defining Your Schema

\`\`\`prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  published Boolean  @default(false)
}
\`\`\`

## Running Migrations

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

## Querying

\`\`\`typescript
const posts = await prisma.post.findMany({
  where: { published: true },
  include: { author: true },
  orderBy: { createdAt: 'desc' },
})
\`\`\`

Prisma's query API is incredibly readable and the TypeScript types are automatically inferred.
`,
      tags: ['Prisma', 'Database', 'TypeScript'],
      category: 'technical',
      type: 'post',
      published: true,
      featured: false,
      createdAt: new Date('2025-10-18'),
    },
    {
      title: 'How to Structure a Next.js Project',
      slug: 'nextjs-project-structure',
      icon: '📁',
      description:
        'Best practices for organizing a Next.js application.',
      content: `# How to Structure a Next.js Project

Project structure is opinionated territory, but there are some patterns that work consistently well for Next.js App Router projects.

## The Basic Structure

\`\`\`
app/
  (public)/          # Public routes grouped
    page.tsx
    blog/
      page.tsx
  (admin)/           # Admin routes grouped
    admin/
      page.tsx
components/
  ui/                # Primitive UI components
  features/          # Feature-specific components
lib/
  db.ts              # Database client
  auth.ts            # Auth utilities
  utils.ts           # Generic utilities
\`\`\`

## Key Principles

### Co-locate Related Things
Keep components with the routes that use them when they're not shared.

### Separate Concerns
Business logic in \`lib/\`, UI in \`components/\`, routes in \`app/\`.

### Use Route Groups
Route groups (folders wrapped in parentheses) let you organize routes without affecting the URL structure.

## What to Avoid

- Deeply nested directories — more than 3-4 levels is a smell
- Mixing client and server components without clear boundaries
- Putting too much logic in route handlers — extract to \`lib/\`
`,
      tags: ['Next.js', 'Architecture'],
      category: 'technical',
      type: 'post',
      published: true,
      featured: false,
      createdAt: new Date('2025-09-08'),
    },
    {
      title: 'My Development Setup in 2025',
      slug: 'dev-setup-2025',
      icon: null,
      description: 'Tools, apps, and configurations I use daily.',
      content: `# My Development Setup in 2025

Every developer has their own workflow. Here's mine as of 2025.

## Hardware

MacBook Pro M3 Pro — the battery life alone makes it worth it.

## Editor

**VS Code** is still my daily driver. Extensions I rely on:
- Prettier (auto-format on save)
- ESLint (catch errors early)
- Prisma (schema highlighting)
- GitLens (git blame inline)

## Terminal

**Windows Terminal** with a custom prompt using Starship.

## Key Tools

- **pnpm** — faster, disk-efficient package manager
- **Docker Desktop** — for local PostgreSQL, Redis
- **TablePlus** — GUI for database management
- **Postman** — API testing
- **Figma** — when I need to design something

## Dotfiles

All my config lives in a private dotfiles repo. The most important bits:
- Custom VS Code settings.json
- Bash aliases for common git commands
- Prettier and ESLint shared configs

## One Thing I'd Change

I wish I had switched to pnpm sooner. The speed difference over npm is noticeable.
`,
      tags: ['Tools', 'Productivity'],
      category: 'personal',
      type: 'post',
      published: true,
      featured: false,
      createdAt: new Date('2025-08-15'),
    },
    {
      title: "Why I'm Considering Content Creation",
      slug: 'content-creation-journey',
      icon: null,
      description:
        'Thoughts on starting a coding-focused YouTube/TikTok channel.',
      content: `# Why I'm Considering Content Creation

I've been thinking about starting a coding-focused YouTube or TikTok channel for a while now. Here's where my head is at.

## The Idea

Short-form content (TikTok, Reels) covering:
- Quick TypeScript tips
- "How I built X in Y minutes" walkthroughs
- Code review / refactoring sessions

## Why I Haven't Done It Yet

Honestly? Fear of the camera. And time. Building things is easier than talking about building things.

## What Changed

I started this blog as a way to document what I'm learning. The discipline of writing has made me better at explaining things. Video feels like the next step.

## The Plan

Start small. Record one video. Don't aim for perfect, aim for done.

If even one person learns something from it, that's enough.

## What Would You Watch?

If you're reading this, I'm curious — what kind of developer content do you find most useful? Let me know on Twitter.
`,
      tags: ['Personal', 'Content'],
      category: 'personal',
      type: 'post',
      published: true,
      featured: false,
      createdAt: new Date('2025-07-20'),
    },
  ]

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: { type: post.type },
      create: post,
    })
  }
  console.log('✅ Blog posts created')

  // Notes
  const notes = [
    {
      title: 'TypeScript utility types cheat sheet',
      slug: 'ts-utility-types',
      content: `# TypeScript Utility Types Cheat Sheet

## Partial<T>
Makes all properties optional.
\`\`\`typescript
type PartialUser = Partial<User>
// All User properties become optional
\`\`\`

## Required<T>
Makes all properties required.
\`\`\`typescript
type RequiredUser = Required<User>
\`\`\`

## Pick<T, K>
Select specific properties.
\`\`\`typescript
type UserPreview = Pick<User, 'id' | 'name' | 'email'>
\`\`\`

## Omit<T, K>
Exclude specific properties.
\`\`\`typescript
type UserWithoutPassword = Omit<User, 'password'>
\`\`\`

## Record<K, V>
Create an object type with specific key/value types.
\`\`\`typescript
type StatusMap = Record<string, boolean>
\`\`\`

## Exclude<T, U>
Exclude types from a union.
\`\`\`typescript
type StringOrNumber = string | number | boolean
type NoBoolean = Exclude<StringOrNumber, boolean> // string | number
\`\`\`

## ReturnType<T>
Get the return type of a function.
\`\`\`typescript
function getUser() { return { id: '1', name: 'Bagas' } }
type User = ReturnType<typeof getUser>
\`\`\`
`,
      tags: ['TypeScript'],
      type: 'note',
      published: true,
      createdAt: new Date('2026-02-20'),
    },
    {
      title: 'Prisma migration workflow',
      slug: 'prisma-migrations',
      content: `# Prisma Migration Workflow

## Development Workflow

\`\`\`bash
# After changing schema.prisma:
npx prisma migrate dev --name describe_your_change

# This:
# 1. Creates a new migration file
# 2. Applies it to your dev database
# 3. Regenerates the Prisma Client
\`\`\`

## Resetting the Database (Dev Only)

\`\`\`bash
npx prisma migrate reset
# Drops DB, re-applies all migrations, runs seed
\`\`\`

## Production Deployment

\`\`\`bash
npx prisma migrate deploy
# Applies pending migrations only (no reset)
\`\`\`

## Viewing Migration Status

\`\`\`bash
npx prisma migrate status
\`\`\`

## Seeding

Add to package.json:
\`\`\`json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
\`\`\`

Then run:
\`\`\`bash
npx prisma db seed
\`\`\`
`,
      tags: ['Prisma', 'Database'],
      type: 'note',
      published: true,
      createdAt: new Date('2026-02-10'),
    },
    {
      title: 'Next.js App Router vs Pages Router',
      slug: 'nextjs-router-comparison',
      content: `# Next.js App Router vs Pages Router

## App Router (Recommended - Next.js 13+)

\`\`\`
app/
  layout.tsx     # Root layout (replaces _app.tsx)
  page.tsx       # Route component
  loading.tsx    # Loading UI
  error.tsx      # Error boundary
  not-found.tsx  # 404 UI
\`\`\`

### Key Differences
- Server Components by default (use \`'use client'\` for client components)
- Nested layouts with persistent UI
- Streaming and Suspense built-in
- \`fetch\` with built-in caching

## Pages Router (Legacy)

\`\`\`
pages/
  _app.tsx       # Global app wrapper
  _document.tsx  # HTML document structure
  index.tsx      # / route
  about.tsx      # /about route
\`\`\`

### Key Differences
- All components are client-side by default
- \`getServerSideProps\` / \`getStaticProps\` for data fetching
- Simpler mental model for small apps

## When to Use Which

**App Router:** New projects, complex layouts, need streaming
**Pages Router:** Legacy projects, simpler needs, familiarity
`,
      tags: ['Next.js'],
      type: 'note',
      published: true,
      createdAt: new Date('2026-01-28'),
    },
    {
      title: 'Git rebase vs merge strategy',
      slug: 'git-rebase-merge',
      content: `# Git Rebase vs Merge

## Merge

Combines branches, preserving full history.

\`\`\`bash
git checkout main
git merge feature-branch
# Creates a merge commit
\`\`\`

**History looks like:**
\`\`\`
A---B---C---M (main, after merge)
     \\     /
      D---E   (feature-branch)
\`\`\`

## Rebase

Replays your commits on top of another branch.

\`\`\`bash
git checkout feature-branch
git rebase main
# Replays feature commits on top of main
\`\`\`

**History looks like:**
\`\`\`
A---B---C---D'---E' (feature-branch after rebase)
\`\`\`

## When to Use

**Merge:**
- Public branches that others depend on
- Preserving exact merge history is important
- Simple feature branches

**Rebase:**
- Cleaning up local commits before merging
- Keeping feature branches up to date with main
- Creating a linear history

## The Golden Rule
Never rebase commits that have been pushed to a public branch. Only rebase local/private commits.
`,
      tags: ['Git'],
      type: 'note',
      published: true,
      createdAt: new Date('2026-01-15'),
    },
    {
      title: 'Docker compose for local dev',
      slug: 'docker-compose-local',
      content: `# Docker Compose for Local Development

## Basic Setup

\`\`\`yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
\`\`\`

## Usage

\`\`\`bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f postgres

# Connect to postgres
docker compose exec postgres psql -U dev -d myapp
\`\`\`

## .env for local dev

\`\`\`
DATABASE_URL="postgresql://dev:dev@localhost:5432/myapp"
REDIS_URL="redis://localhost:6379"
\`\`\`

## Health Check

\`\`\`yaml
services:
  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 5s
      timeout: 5s
      retries: 5
\`\`\`
`,
      tags: ['Docker', 'DevOps'],
      type: 'note',
      published: true,
      createdAt: new Date('2025-12-22'),
    },
    {
      title: 'VS Code shortcuts I use daily',
      slug: 'vscode-shortcuts',
      content: `# VS Code Shortcuts I Use Daily

## Navigation
| Shortcut | Action |
|----------|--------|
| \`Ctrl+P\` | Quick file open |
| \`Ctrl+Shift+P\` | Command palette |
| \`Ctrl+G\` | Go to line |
| \`Ctrl+Tab\` | Switch between open files |
| \`Ctrl+B\` | Toggle sidebar |

## Editing
| Shortcut | Action |
|----------|--------|
| \`Alt+↑/↓\` | Move line up/down |
| \`Shift+Alt+↓\` | Duplicate line down |
| \`Ctrl+D\` | Select next occurrence |
| \`Ctrl+/\` | Toggle line comment |
| \`Ctrl+Shift+K\` | Delete line |
| \`Ctrl+Z\` / \`Ctrl+Shift+Z\` | Undo / Redo |

## Multi-cursor
| Shortcut | Action |
|----------|--------|
| \`Alt+Click\` | Add cursor |
| \`Ctrl+Alt+↑/↓\` | Add cursor above/below |
| \`Ctrl+Shift+L\` | Select all occurrences |

## Terminal
| Shortcut | Action |
|----------|--------|
| Ctrl+\` | Toggle terminal |
| \`Ctrl+Shift+5\` | Split terminal |

## Search
| Shortcut | Action |
|----------|--------|
| \`Ctrl+F\` | Find in file |
| \`Ctrl+Shift+F\` | Find in all files |
| \`Ctrl+H\` | Find and replace |
`,
      tags: ['VS Code', 'Productivity'],
      type: 'note',
      published: true,
      createdAt: new Date('2025-12-05'),
    },
  ]

  for (const note of notes) {
    await prisma.post.upsert({
      where: { slug: note.slug },
      update: {},
      create: note,
    })
  }
  console.log('✅ Notes created')

  // Projects
  const projects = [
    {
      name: 'QA Dashboard',
      slug: 'qa-dashboard',
      description: 'Comprehensive QA platform with test runs and releases.',
      repo: 'https://github.com/bagas/qa-dashboard',
      demoUrl: null,
      articleUrl: '/blog/building-qa-dashboard',
      year: 2026,
      tech: ['Next.js', 'Fastify', 'Prisma', 'TypeScript'],
      featured: true,
      sortOrder: 1,
    },
    {
      name: 'SGK Performance Hub',
      slug: 'sgk-hub',
      description: 'Banking app for sales/marketing target tracking.',
      repo: null,
      demoUrl: null,
      articleUrl: null,
      year: 2026,
      tech: ['React', 'TypeScript', 'Node.js'],
      featured: true,
      sortOrder: 2,
    },
    {
      name: 'Component Library',
      slug: 'component-library',
      description: 'Reusable UI components with design tokens.',
      repo: 'https://github.com/bagas/component-library',
      demoUrl: 'https://components.bagas.dev',
      articleUrl: null,
      year: 2025,
      tech: ['React', 'CSS Modules', 'Storybook'],
      featured: false,
      sortOrder: 3,
    },
    {
      name: 'Notification System',
      slug: 'notification-system',
      description: 'Real-time alerts with email and in-app messaging.',
      repo: 'https://github.com/bagas/notification-system',
      demoUrl: null,
      articleUrl: null,
      year: 2025,
      tech: ['Fastify', 'WebSocket', 'Redis'],
      featured: false,
      sortOrder: 4,
    },
  ]

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        demoUrl: project.demoUrl,
        articleUrl: project.articleUrl,
        year: project.year,
        description: project.description,
      },
      create: project,
    })
  }
  console.log('✅ Projects created')

  // Experiences (sorted by sortOrder — same company roles are consecutive for grouping)
  const experiences = [
    {
      title: 'Backend Developer',
      company: 'PT Solusi Digital Nusantara',
      companyLogo: null,
      location: 'Jakarta, Indonesia',
      startDate: new Date('2024-03-01'),
      endDate: null,
      current: true,
      description:
        'Led monolith-to-microservices migration, improving response times by 40%. Designed role-based access control system and real-time WebSocket notifications.',
      tech: ['Node.js', 'Fastify', 'PostgreSQL', 'Redis', 'Docker'],
      projects: [{ name: 'SGK Performance Hub', logo: '', url: '' }],
      sortOrder: 0,
    },
    {
      title: 'Junior Backend Developer',
      company: 'PT Solusi Digital Nusantara',
      companyLogo: null,
      location: 'Jakarta, Indonesia',
      startDate: new Date('2023-03-01'),
      endDate: new Date('2024-02-28'),
      current: false,
      description:
        'Built REST APIs and WebSocket services for banking platform. Implemented automated testing pipeline with 85% code coverage.',
      tech: ['Node.js', 'Express', 'PostgreSQL'],
      projects: [{ name: 'Internal Tools Dashboard', logo: '', url: '' }],
      sortOrder: 1,
    },
    {
      title: 'Full-Stack Developer',
      company: 'Kreasi Teknologi Indonesia',
      companyLogo: null,
      location: 'Bandung, Indonesia',
      startDate: new Date('2022-07-01'),
      endDate: new Date('2023-02-28'),
      current: false,
      description:
        'Developed client-facing web apps and internal tools for e-commerce clients. Built a headless CMS with Next.js and improved page load by 60%.',
      tech: ['Next.js', 'React', 'TypeScript', 'Prisma'],
      projects: [
        { name: 'E-Commerce Platform', logo: '', url: '' },
        { name: 'Headless CMS', logo: '', url: '' },
      ],
      sortOrder: 2,
    },
    {
      title: 'Junior Web Developer',
      company: 'Startup Lokal',
      companyLogo: null,
      location: 'Remote',
      startDate: new Date('2021-01-01'),
      endDate: new Date('2022-06-30'),
      current: false,
      description:
        'First engineering hire. Built landing page, admin dashboard, and customer portal from scratch. Rapid prototyping under tight deadlines.',
      tech: ['React', 'Node.js', 'MongoDB', 'Express'],
      projects: [{ name: 'Customer Portal', logo: '', url: '' }],
      sortOrder: 3,
    },
  ]

  for (const exp of experiences) {
    const existing = await prisma.experience.findFirst({
      where: { title: exp.title, company: exp.company },
    })
    if (!existing) {
      await prisma.experience.create({ data: exp })
    }
  }
  console.log('✅ Experiences created')

  console.log('\n🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
