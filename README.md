# Bulk Email Verifier - SaaS Platform

Full-stack email verification SaaS with a React frontend and Express API backend. Validates emails using 5-layer verification (Regex, Typo, Disposable, MX, SMTP) with tiered API key access.

## Features

- **5-Layer Email Validation**: Regex, Typo detection, Disposable domain check, MX record verification
- **Enterprise SaaS UI**: Stripe/Linear-tier design with Inter + JetBrains Mono fonts
- **User Accounts**: Signup/Login with bcrypt-hashed passwords, automatic API key generation
- **Tiered API Access**: Free, Pro, and Enterprise tiers with different rate limits
- **Bulk Validation**: Validate up to 10,000 emails per request (Enterprise tier)
- **Dashboard**: Drag-and-drop CSV import, search/filter/pagination, CSV export, keyboard shortcuts
- **Swagger/OpenAPI Docs**: Self-documenting API at `/docs`
- **SQLite/Turso**: Works locally with SQLite, deploys to Turso (free 9GB) for production

## Quick Start

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Create .env
cp .env.example .env

# Build the frontend
npm run build

# Start the server
npm start
```

Open `http://localhost:3000`

## Development

```bash
# Terminal 1: API server
npm run dev

# Terminal 2: Vite dev server (hot reload)
npm run dev:client
```

Vite runs on port 5173 and proxies `/api` and `/docs` to Express on port 3000.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Marketing, features, pricing, FAQ |
| `/signup` | Signup | Create account, get API key |
| `/login` | Login | Sign in with email + password |
| `/dashboard` | Dashboard | Main verification workspace |
| `/security` | Security | Security specs and protocol details |
| `/gdpr` | GDPR | GDPR compliance documentation |
| `/docs` | API Docs | Interactive Swagger documentation |

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/signup` | Create account (name, email, password) |
| `POST` | `/api/v1/auth/login` | Login (email, password) |
| `GET` | `/api/v1/auth/me` | Get current user (requires API key) |

### Protected (requires `X-API-Key` header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/validate` | Validate a single email |
| `POST` | `/api/v1/validate/bulk` | Validate multiple emails |
| `GET` | `/api/v1/usage` | Get usage stats |

### Admin (requires admin key)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/admin/keys` | Create API key |
| `GET` | `/api/v1/admin/keys` | List all keys |
| `POST` | `/api/v1/admin/keys/:id/deactivate` | Deactivate key |
| `POST` | `/api/v1/admin/keys/:id/reactivate` | Reactivate key |
| `PUT` | `/api/v1/admin/keys/:id/tier` | Update tier |
| `DELETE` | `/api/v1/admin/keys/:id` | Delete key |

## Tiers & Rate Limits

| Tier | Requests/min | Max Batch | Daily Emails |
|------|-------------|-----------|--------------|
| Free | 10 | 50 | 500 |
| Pro | 100 | 1,000 | 50,000 |
| Enterprise | 1,000 | 10,000 | Unlimited |

## Deployment (Free Tier)

### Option 1: Railway + Turso (Recommended)

**1. Create Turso database (free):**
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login and create database
turso auth login
turso db create bulk-email-verifier
turso db tokens create bulk-email-verifier
```

**2. Deploy to Railway:**
1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. New Project > Deploy from GitHub repo
4. Add environment variables:
   - `TURSO_DATABASE_URL` = `libsql://your-db-name-your-org.turso.io`
   - `TURSO_AUTH_TOKEN` = your token
   - `ADMIN_KEY` = a secure random string
   - `NODE_ENV` = `production`
5. Railway auto-deploys using the `Dockerfile`

### Option 2: Render (Free Tier)

1. Push to GitHub
2. Go to [render.com](https://render.com)
3. New Web Service > Connect repo
4. Build command: `npm install && cd client && npm install && npm run build`
5. Start command: `node src/index.js`
6. Add env vars same as above

### Option 3: Fly.io (Free Tier)

```bash
fly auth login
fly launch
fly secrets set TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... ADMIN_KEY=...
fly deploy
```

## Configuration

Copy `.env.example` to `.env`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
CORS_ORIGINS=*
LOG_LEVEL=info
ADMIN_KEY=your-secure-admin-key

# Local (no config needed)
# DB_PATH=./data/verifier.db

# Production (Turso free tier)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

## Project Structure

```
Bulk-Email-Verifier-API/
├── client/                    # React SPA (Vite + TypeScript + Tailwind v4)
│   ├── src/
│   │   ├── pages/             # Landing, Dashboard, Login, Signup, Security, GDPR
│   │   ├── components/        # Header, Footer, StatusBadge, Button, Card, etc.
│   │   ├── api/               # API client (fetch wrapper with X-API-Key)
│   │   ├── context/           # AuthContext (login/signup/logout state)
│   │   └── hooks/             # useAuth, useValidation
│   └── vite.config.ts
├── src/                       # Express API server
│   ├── routes/                # validate, usage, health, auth, admin
│   ├── services/              # emailValidator, keyManager, userManager
│   ├── middleware/             # auth, rateLimiter, validator, errorHandler
│   ├── db/                    # SQLite (sql.js) / Turso database layer
│   └── docs/                  # Swagger/OpenAPI spec
├── scripts/                   # CLI key management tool
├── tests/                     # Unit tests (vitest)
├── Dockerfile                 # Production Docker build
├── railway.json               # Railway deployment config
└── dist/                      # Built React app (served by Express)
```

## CLI Key Management

```bash
npm run generate-key -- create "Production API" pro
npm run generate-key -- list
npm run generate-key -- deactivate 1
npm run generate-key -- reactivate 1
```

## License

MIT
