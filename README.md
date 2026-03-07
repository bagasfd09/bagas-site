# bagas.dev — Personal Portfolio

A full-stack personal portfolio website built with Next.js 14, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL.

## Features

- Public site with blog, notes, projects, skills, and about me pages
- Admin panel at `/admin` with JWT auth
- Dark/light theme toggle
- SEO optimized (sitemap, robots.txt, JSON-LD, OG images)
- Google Search Console analytics integration
- GitHub project sync

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT + bcrypt (HTTP-only cookies)
- **Markdown**: react-markdown + remark-gfm + rehype-highlight

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your site URL for SEO |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | No | Google service account for Search Console |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | No | Google service account private key |
| `GOOGLE_SEARCH_CONSOLE_SITE` | No | Search Console property (e.g. `sc-domain:yourdomain.com`) |
| `GOOGLE_SITE_VERIFICATION` | No | Google site verification code |
| `GITHUB_TOKEN` | No | GitHub token for project sync (5000 req/hr) |

## Getting Started

### Option 1: Docker (Recommended)

The easiest way to run everything — app + PostgreSQL in one command.

```bash
# Start app and database
docker compose up -d --build

# First time: run database seed
docker compose exec app npx prisma db seed

# View logs
docker compose logs -f app

# Stop
docker compose down

# Stop and delete database volume
docker compose down -v
```

App runs at http://localhost:3000

### Option 2: Local Development

#### Prerequisites

- Node.js 18+
- PostgreSQL running locally

#### Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start dev server
npm run dev
```

App runs at http://localhost:3000

## Deploy to Production

### Option A: Docker (VPS / Cloud Server)

1. Push to GitHub
2. SSH into your server
3. Clone the repo and create `.env.local` with production values
4. Run:

```bash
docker compose up -d --build
docker compose exec app npx prisma db seed
```

For HTTPS, put Nginx or Caddy in front as a reverse proxy to port 3000.

### Option B: Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **"Add New Project"** and import `bagas-site`
3. Add environment variables (see table above)
4. Click **Deploy**
5. After deploy, run migrations on your hosted DB:

```bash
DATABASE_URL="your-hosted-db-url" npx prisma migrate deploy
DATABASE_URL="your-hosted-db-url" npx prisma db seed
```

#### Connect custom domain

1. In Vercel project settings → **Domains** → add `bagas.dev`
2. Update DNS records as shown by Vercel
3. SSL is automatic

#### Submit sitemap

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Sitemaps** in the sidebar
3. Submit: `https://bagas.dev/sitemap.xml`

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Admin Panel

Login at `/admin` with username `admin` and the password you set in `ADMIN_PASSWORD`.

Features: Dashboard, Posts, Notes, Projects, Skills, About Me editor, Site Settings, Analytics.
