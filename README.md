# Bulk Email Verifier API

Production-ready REST API for email validation with tiered API key access. Validates emails using 5-layer verification and is ready to sell as a SaaS.

## Features

- **5-Layer Email Validation**: Regex, Typo detection, Disposable domain check, MX record verification, SMTP mailbox verification
- **Tiered API Access**: Free, Pro, and Enterprise tiers with different rate limits
- **API Key Authentication**: Secure SHA-256 hashed keys with prefix display
- **Usage Tracking**: Per-key usage stats for billing and monitoring
- **Bulk Validation**: Validate up to 10,000 emails per request (Enterprise tier)
- **Swagger/OpenAPI Docs**: Self-documenting API at `/docs`
- **Admin Key Management**: CLI tool + REST endpoints for managing API keys
- **SQLite Storage**: Zero-config, file-based database

## Quick Start

```bash
# Install dependencies
npm install

# Create a .env file
cp .env.example .env

# Generate your first API key
npm run generate-key -- create "My App" free

# Start the server
npm start
```

The API will be available at `http://localhost:3000` with docs at `http://localhost:3000/docs`.

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check (no auth required) |

### Protected (requires `X-API-Key` header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/validate` | Validate a single email |
| `POST` | `/api/v1/validate/bulk` | Validate multiple emails |
| `GET` | `/api/v1/usage` | Get usage stats for your key |

### Admin (requires admin key)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/admin/keys` | Create a new API key |
| `GET` | `/api/v1/admin/keys` | List all API keys |
| `POST` | `/api/v1/admin/keys/:id/deactivate` | Deactivate a key |
| `POST` | `/api/v1/admin/keys/:id/reactivate` | Reactivate a key |
| `PUT` | `/api/v1/admin/keys/:id/tier` | Update key tier |
| `DELETE` | `/api/v1/admin/keys/:id` | Delete a key |

## Usage Examples

### Validate a Single Email

```bash
curl -X POST http://localhost:3000/api/v1/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bev_your_key_here" \
  -d '{"email": "user@example.com"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "isValid": true,
    "isRisky": false,
    "score": 85,
    "reason": null,
    "typoSuggestion": null,
    "isDisposable": false,
    "mxValid": true,
    "smtpValid": true
  },
  "meta": { "duration_ms": 342 }
}
```

### Bulk Validate Emails

```bash
curl -X POST http://localhost:3000/api/v1/validate/bulk \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bev_your_key_here" \
  -d '{"emails": ["user@example.com", "test@gmail.com", "bad@nowhere.xyz"]}'
```

Response:
```json
{
  "success": true,
  "data": {
    "results": [...],
    "stats": {
      "total": 3,
      "valid": 2,
      "invalid": 0,
      "risky": 1,
      "errors": 0,
      "duration_ms": 1200
    }
  }
}
```

## Tiers & Rate Limits

| Tier | Requests/min | Max Batch Size | Daily Emails |
|------|-------------|----------------|--------------|
| Free | 10 | 50 | 500 |
| Pro | 100 | 1,000 | 50,000 |
| Enterprise | 1,000 | 10,000 | Unlimited |

## CLI Key Management

```bash
# Create a key
npm run generate-key -- create "Production API" pro

# List all keys
npm run generate-key -- list

# Deactivate a key
npm run generate-key -- deactivate 1

# Reactivate a key
npm run generate-key -- reactivate 1
```

## Configuration

Copy `.env.example` to `.env` and configure:

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

### Docker (recommended)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p data
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### Environment Variables for Production

- Set `NODE_ENV=production`
- Set a strong `ADMIN_KEY`
- Configure `CORS_ORIGINS` for your frontend
- Use a process manager like PM2 or run behind nginx

## License

MIT
