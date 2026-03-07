# bagas.dev — Personal Portfolio

A full-stack personal portfolio website built with Next.js 14, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL.

## Features

- Public site with blog, notes, projects, skills, and about me pages
- Admin panel at `/admin` with JWT auth
- Dark/light theme toggle
- SEO optimized (sitemap, robots.txt, JSON-LD, OG images)
- Google Search Console analytics integration
- GitHub project sync
- CI/CD auto-deploy via GitHub Actions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Auth**: JWT + bcrypt (HTTP-only cookies)
- **Markdown**: react-markdown + remark-gfm + rehype-highlight
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions → GitHub Container Registry → VPS
- **Reverse Proxy**: Nginx (with Certbot for HTTPS)

## Environment Variables

Copy `.env.example` to `.env.local` (local dev) or `.env` (production):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (local only) | PostgreSQL connection URL |
| `DB_PASSWORD` | Yes (prod only) | Database password (used in docker-compose.prod.yml) |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Site URL for SEO (e.g. `https://bagas.dev`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | No | Google service account for Search Console |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | No | Google service account private key |
| `GOOGLE_SEARCH_CONSOLE_SITE` | No | Search Console property (`sc-domain:bagas.dev`) |
| `GOOGLE_SITE_VERIFICATION` | No | Google site verification code |
| `GITHUB_TOKEN` | No | GitHub token for project sync (5000 req/hr) |

## Local Development

### Option 1: Docker (Recommended)

```bash
# Start app + PostgreSQL
docker compose up -d --build

# First time only: seed database
docker compose exec app npx prisma db seed

# View logs
docker compose logs -f app

# Stop
docker compose down

# Stop and delete database
docker compose down -v
```

App runs at http://localhost:3000

### Option 2: Without Docker

Prerequisites: Node.js 20+, PostgreSQL running locally.

```bash
npm install
cp .env.example .env.local    # edit with your values
npx prisma migrate dev
npx prisma db seed
npm run dev
```

App runs at http://localhost:3000

---

## Production Deployment (VPS + Docker)

### Prerequisites on VPS

- Ubuntu 22.04+ (or similar Linux)
- Docker and Docker Compose installed
- A domain pointing to VPS IP (e.g. `bagas.dev` → your VPS IP)

If Docker is not installed, run on VPS:

```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo usermod -aG docker $USER
exit
# Login again for group change to take effect
```

### Step 1: Setup GitHub Secrets

Go to https://github.com/bagasfd09/bagas-site → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add these 4 secrets:

| Secret | How to get it |
|--------|---------------|
| `VPS_HOST` | Your VPS IP address (from Hostinger dashboard) |
| `VPS_USER` | SSH username (e.g. `gitaction` or `root`) |
| `VPS_SSH_KEY` | Run `cat ~/.ssh/id_ed25519` on your local PC, copy entire output including BEGIN/END lines |
| `GHCR_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic) → check `read:packages` + `write:packages` → Generate → copy token |

Also make sure the public key (`~/.ssh/id_ed25519.pub` from local PC) is added to VPS:

```bash
# On VPS, run:
mkdir -p ~/.ssh
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Step 2: Setup project directory on VPS

SSH into your VPS and run:

```bash
# Create project directory
sudo mkdir -p /project/bagas-site
sudo chown $USER:$USER /project/bagas-site
cd /project/bagas-site

# Download production compose file
curl -O https://raw.githubusercontent.com/bagasfd09/bagas-site/main/docker-compose.prod.yml

# Create production environment file
cat > .env << 'ENVEOF'
DB_PASSWORD=CHANGE_ME_TO_STRONG_PASSWORD
ADMIN_PASSWORD=CHANGE_ME
JWT_SECRET=CHANGE_ME_MIN_32_CHARS_RANDOM_STRING
NEXT_PUBLIC_SITE_URL=https://bagas.dev
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=
GOOGLE_SEARCH_CONSOLE_SITE=sc-domain:bagas.dev
GOOGLE_SITE_VERIFICATION=
ENVEOF

# IMPORTANT: Edit .env and replace all CHANGE_ME values
nano .env
```

### Step 3: Setup HTTPS with Nginx + Certbot

```bash
# Install Nginx
sudo apt update
sudo apt install -y nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/bagas.dev << 'EOF'
server {
    listen 80;
    server_name bagas.dev www.bagas.dev;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/bagas.dev /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (make sure DNS A record points to VPS IP first)
sudo certbot --nginx -d bagas.dev -d www.bagas.dev

# Auto-renewal is enabled by default, verify with:
sudo certbot renew --dry-run
```

Make sure your domain DNS A record points to your VPS IP before running Certbot.

### Step 4: First deploy

Push any change to `main` branch to trigger the CI/CD pipeline:

```bash
git push origin main
```

This will automatically:
1. Build Docker image on GitHub Actions
2. Push image to GitHub Container Registry (ghcr.io)
3. SSH into your VPS
4. Pull the latest image
5. Restart containers

Monitor the deploy at: https://github.com/bagasfd09/bagas-site/actions

### Step 5: Seed the database (first time only)

After the first successful deploy, SSH into VPS and run:

```bash
cd /project/bagas-site
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

### Step 6: Verify everything works

```bash
# Check containers are running
cd /project/bagas-site
docker compose -f docker-compose.prod.yml ps

# Check app logs
docker compose -f docker-compose.prod.yml logs -f app

# Check database logs
docker compose -f docker-compose.prod.yml logs -f db

# Test the site
curl -I https://bagas.dev
```

### Troubleshooting

```bash
cd /project/bagas-site

# Restart all containers
docker compose -f docker-compose.prod.yml restart

# Rebuild and restart
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d

# View real-time logs
docker compose -f docker-compose.prod.yml logs -f

# Enter app container shell
docker compose -f docker-compose.prod.yml exec app sh

# Run database migration manually
docker compose -f docker-compose.prod.yml exec app ./node_modules/.bin/prisma migrate deploy

# Reset database (WARNING: deletes all data)
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on every push to `main`:

```
Push to main → Build Docker image → Push to GHCR → SSH to VPS → Pull & restart
```

### Manual deploy (without CI/CD)

If you need to deploy manually on VPS:

```bash
cd /project/bagas-site
echo YOUR_GHCR_TOKEN | docker login ghcr.io -u bagasfd09 --password-stdin
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d
```

---

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

Login at `/admin` with username `admin` and the password from `ADMIN_PASSWORD`.

Features: Dashboard, Posts, Notes, Projects, Skills, About Me editor, Site Settings, Analytics.

## Post-deploy: Submit sitemap to Google

After your site is live:

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Sitemaps** in the sidebar
3. Submit: `https://bagas.dev/sitemap.xml`
