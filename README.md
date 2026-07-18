# Bulk Email Verifier - SaaS Platform

Full-stack email verification SaaS with a React frontend and Express API backend. Validates emails using 5-layer verification (Regex, Typo, Disposable, MX, SMTP) with tiered API key access.

## Features

- **5-Layer Email Validation**: Regex, Typo detection, Disposable domain check, MX record verification, SMTP mailbox verification
- **Enterprise SaaS UI**: Stripe/Linear-tier design with Inter + JetBrains Mono fonts, data-dense layouts, and real-time results
- **User Accounts**: Signup/Login with bcrypt-hashed passwords, automatic API key generation
- **Tiered API Access**: Free, Pro, and Enterprise tiers with different rate limits
- **Bulk Validation**: Validate up to 10,000 emails per request (Enterprise tier)
- **Dashboard**: Drag-and-drop CSV import, search/filter/pagination, CSV export, keyboard shortcuts, batch history
- **Swagger/OpenAPI Docs**: Self-documenting API at `/docs`
- **Admin Key Management**: CLI tool + REST endpoints for managing API keys
- **SQLite Storage**: Zero-config, file-based database

## Quick Start

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Create a .env file
cp .env.example .env

# Build the frontend
npm run build

# Start the server (serves both API + SPA)
npm start
```

Open `http://localhost:3000` to see the full SaaS application.

## Development

Run the API and frontend dev server separately:

```bash
# Terminal 1: API server
npm run dev

# Terminal 2: Vite dev server (hot reload)
npm run dev:client
```

The Vite dev server runs on port 5173 and proxies `/api` and `/docs` to the Express server on port 3000.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Marketing page with features, pricing, FAQ |
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
│   ├── db/                    # SQLite (sql.js) database + migrations
│   └── docs/                  # Swagger/OpenAPI spec
├── scripts/                   # CLI key management tool
├── tests/                     # Unit tests (vitest)
└── dist/                      # Built React app (served by Express)
```

## Configuration

Copy `.env.example` to `.env`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
CORS_ORIGINS=*
DB_PATH=./data/verifier.db
LOG_LEVEL=info
ADMIN_KEY=your-secure-admin-key
```

## Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN cd client && npm ci && npm run build
RUN mkdir -p data
EXPOSE 3000
CMD ["node", "src/index.js"]
```

## License

MIT
