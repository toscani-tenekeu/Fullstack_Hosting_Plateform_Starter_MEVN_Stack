# Backend Workspace

Express and MongoDB API for the Fullstack Hosting Platform Starter. This directory is an npm workspace managed from the repository root.

Use the [main README](../README.md) for complete installation, configuration and development instructions.

## Backend-only Commands

Run these commands from the repository root:

```bash
npm run dev:backend
npm run build:backend
npm run test:backend
npm run seed:offers
npm run setup:admin -- --email user@example.com
```

API endpoints:

- Health check: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`
