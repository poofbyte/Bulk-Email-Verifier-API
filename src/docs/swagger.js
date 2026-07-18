const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Bulk Email Verifier API',
      version: '1.0.0',
      description: `
# Bulk Email Verifier API

Production-ready email validation API with tiered access. Validates emails using 5-layer verification:

1. **Regex** - RFC 5322 format validation
2. **Typo** - Domain typo detection and suggestions
3. **Disposable** - 160,000+ disposable email domains
4. **MX** - DNS MX record verification
5. **SMTP** - Mailbox existence verification

## Authentication

All endpoints (except health check) require an \`X-API-Key\` header.

## Rate Limits

| Tier | Requests/min | Max Batch | Daily Emails |
|------|-------------|-----------|--------------|
| Free | 10 | 50 | 500 |
| Pro | 100 | 1,000 | 50,000 |
| Enterprise | 1,000 | 10,000 | Unlimited |
      `,
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Your API key (format: bev_...)',
        },
        AdminKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Admin key for key management',
        },
      },
    },
    tags: [
      { name: 'Validation', description: 'Email validation endpoints' },
      { name: 'Usage', description: 'Usage statistics' },
      { name: 'System', description: 'Health and system info' },
      { name: 'Admin', description: 'API key management (admin only)' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
