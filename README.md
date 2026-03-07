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

### Option A: Docker + VPS (with CI/CD)

Auto-deploy on every push to `main` via GitHub Actions.

#### 1. Setup GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions, add:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | Your server IP (e.g. `123.456.78.90`) |
| `VPS_USER` | SSH username (e.g. `root`) |
| `VPS_SSH_KEY` | Your private SSH key (paste full key) |
| `GHCR_TOKEN` | GitHub Personal Access Token with `read:packages` scope |

#### 2. First-time VPS setup

SSH into your server and run:

```bash
# Create project directory
mkdir -p ~/bagas-site && cd ~/bagas-site

# Create .env file with production values
cat > .env << 'EOF'
DB_PASSWORD=your-strong-db-password
ADMIN_PASSWORD=your-admin-password
JWT_SECRET=your-jwt-secret-at-least-32-chars
NEXT_PUBLIC_SITE_URL=https://bagas.dev
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=
GOOGLE_SEARCH_CONSOLE_SITE=sc-domain:bagas.dev
GOOGLE_SITE_VERIFICATION=
EOF

# Copy the production compose file
# (or scp from local: scp docker-compose.prod.yml user@server:~/bagas-site/docker-compose.prod.yml)
```

#### 3. Push to deploy

Every push to `main` will automatically:
1. Build Docker image → push to GitHub Container Registry
2. SSH into VPS → pull new image → restart containers

```bash
git push origin main  # triggers auto-deploy
```

#### 4. First deploy: seed database

```bash
ssh user@your-server
cd ~/bagas-site
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

#### 5. HTTPS with Caddy (recommended)

Install Caddy on your VPS for automatic HTTPS:

```bash
# Install Caddy
sudo apt install -y caddy

# Edit Caddyfile
sudo tee /etc/caddy/Caddyfile << 'EOF'
bagas.dev {
    reverse_proxy localhost:3000
}
EOF

# Restart Caddy
sudo systemctl restart caddy
```

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
