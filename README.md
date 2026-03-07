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

## Local Development

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bagas_portfolio"
ADMIN_PASSWORD="your-secure-password"
JWT_SECRET="your-jwt-secret-at-least-32-chars"
NEXT_PUBLIC_SITE_URL="https://bagas.dev"
```

### 4. Database setup

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Run dev server

```bash
npm run dev
```

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/bagas-site.git
git branch -M main
git push -u origin main
```

### Step 2: Set up a PostgreSQL database

Use one of these hosted PostgreSQL providers (all have free tiers):

- **Neon** (recommended): https://neon.tech — generous free tier, serverless PostgreSQL
- **Supabase**: https://supabase.com — free tier with 500MB
- **Railway**: https://railway.app — free trial credits

After creating a database, copy the connection URL (looks like `postgresql://user:pass@host:5432/dbname`).

### Step 3: Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `bagas-site` repository
4. In **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your hosted PostgreSQL connection URL |
| `ADMIN_PASSWORD` | Your admin password |
| `JWT_SECRET` | A random 32+ character secret |
| `NEXT_PUBLIC_SITE_URL` | `https://bagas.dev` (or your Vercel URL) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | (optional) Google service account email |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | (optional) Google service account private key |
| `GOOGLE_SEARCH_CONSOLE_SITE` | (optional) `sc-domain:bagas.dev` |
| `GOOGLE_SITE_VERIFICATION` | (optional) Google verification code |

5. Click **Deploy**

### Step 4: Run database migrations

After the first deploy, run migrations on your hosted database. You can do this locally by temporarily pointing `DATABASE_URL` to your hosted DB:

```bash
DATABASE_URL="your-hosted-db-url" npx prisma migrate deploy
DATABASE_URL="your-hosted-db-url" npx prisma db seed
```

Or use Vercel CLI:

```bash
npx vercel env pull .env.production.local
npx prisma migrate deploy
npx prisma db seed
```

### Step 5: Connect custom domain (optional)

1. In Vercel project settings, go to **Domains**
2. Add `bagas.dev`
3. Update your DNS records as shown by Vercel
4. SSL is automatic

### Step 6: Submit sitemap to Google

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
